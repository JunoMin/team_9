"""Collect public LH land notices and attachments; publish only a complete local workbook.

No API key, external-site login, PDF regulatory interpretation or service deployment.
All paths in the config are relative to the repository, unless absolute.
"""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlencode, urlparse
import zipfile

ROOT = Path(os.environ.get('LH_REGULATION_REPO', Path(__file__).resolve().parents[1]))
BASE = 'https://apply.lh.or.kr'
KST = timezone(timedelta(hours=9))


def resolve(value):
    return (ROOT / value).resolve()


def write_json(path, value):
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')
    temp.replace(path)


def safe(value):
    return re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', value).strip(' .')[:110] or 'file'


class LHRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if urlparse(newurl).hostname != 'apply.lh.or.kr':
            raise ValueError('External redirect excluded: ' + newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class Client:
    def __init__(self, config):
        self.delay = config['requestDelaySeconds']
        self.limit = config['maxDownloadMB'] * 1024 * 1024
        self.opener = urllib.request.build_opener(LHRedirect)

    def get(self, url, headers=None):
        if urlparse(url).hostname != 'apply.lh.or.kr':
            raise ValueError('Only public LH URLs are collected')
        for attempt in range(3):
            time.sleep(self.delay)
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', **(headers or {})})
                with self.opener.open(req, timeout=60) as response:
                    if int(response.headers.get('Content-Length', 0)) > self.limit:
                        raise ValueError('Attachment exceeds configured maxDownloadMB')
                    data = response.read(self.limit + 1)
                    if len(data) > self.limit:
                        raise ValueError('Attachment exceeds configured maxDownloadMB')
                    return data, dict(response.headers)
            except urllib.error.HTTPError as error:
                if error.code == 304:
                    return None, {}
                if attempt == 2:
                    raise
            except (OSError, TimeoutError):
                if attempt == 2:
                    raise
            time.sleep(2 ** attempt)


def parse_listing(html):
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    label = soup.select_one('.bbs_total')
    match = re.search(r'전체\s*([\d,]+)', label.get_text(' ', strip=True)) if label else None
    if not match:
        raise ValueError('LH list layout changed: total count missing')
    rows = []
    for anchor in soup.select('a.wrtancInfoBtn'):
        cells = anchor.find_parent('tr').find_all('td')
        if len(cells) < 8:
            raise ValueError('LH list columns changed')
        params = dict(mi='1062', panId=anchor['data-id1'], ccrCnntSysDsCd=anchor['data-id2'],
                      uppAisTpCd=anchor['data-id3'], aisTpCd=anchor['data-id4'])
        rows.append(dict(id=params['panId'], title=re.sub(r'\s*\d+일전$', '', anchor.get_text(' ', strip=True)),
                         region=cells[3].get_text(strip=True), posted=cells[5].get_text(strip=True),
                         deadline=cells[6].get_text(strip=True), status=cells[7].get_text(strip=True),
                         url=BASE + '/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?' + urlencode(params)))
    paging = {i['name']: i.get('value', '') for i in soup.select('form[name=pagingForm] input[name]')}
    return int(match[1].replace(',', '')), rows, paging


def listing(client, config, today):
    result = {}
    for status in config['statuses']:
        params = dict(mi='1062', uppAisTpCd='01', srchUppAisTpCd='01', panSs=status,
                      startDt=config['startDate'], endDt=today, listCo='100', srchY='Y', currPage=1)
        seen = set()
        for page in range(1, 1001):
            params.update(currPage=page, panSs=status)
            total, rows, paging = parse_listing(client.get(BASE + '/lhapply/apply/wt/wrtanc/selectWrtancList.do?' + urlencode(params))[0])
            if any(row['status'] != status for row in rows):
                raise ValueError('LH ignored requested status filter')
            if any(row['id'] in seen for row in rows):
                raise ValueError('Repeated page/notice: refusing incomplete snapshot')
            seen.update(row['id'] for row in rows)
            result.update((row['id'], row) for row in rows)
            if len(seen) == total:
                break
            if not rows or len(seen) > total:
                raise ValueError('LH pagination count mismatch')
            params.update(paging)
        else:
            raise ValueError('LH pagination limit exceeded')
    if not result:
        raise ValueError('Empty collection: previous successful output retained')
    return sorted(result.values(), key=lambda n: (n['region'], n['id']))


def parse_detail(html):
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    attachments = {}
    for a in soup.select('a'):
        match = re.search(r"fileDownLoad\('([^']+)'\)", a.get('href', ''))
        if not match:
            continue
        group = a.find_parent('dl')
        label = group.find('dt').get_text(strip=True) if group and group.find('dt') else ''
        name = a.get_text(strip=True)
        if label == '공고문' or re.search('지침|지구단위|관련자료|관련도면|고시문|종개|계획', name):
            attachments[match[1]] = dict(id=match[1], name=name, group=label,
                                       url=BASE + '/lhapply/lhFile.do?' + urlencode({'fileid': match[1]}))
    parcels = []
    for table in soup.find_all('table'):
        caption = table.find('caption')
        if caption and '공급필지 정보' in caption.get_text():
            headers = [c.get_text(' ', strip=True) for c in table.find_all('th')]
            for row in table.select('tbody tr'):
                cells = [c.get_text(' ', strip=True) for c in row.find_all('td', recursive=False)]
                if len(cells) > 4:
                    parcels.append(dict(headers=headers, cells=cells))
    if not soup.select('table, dl'):
        raise ValueError('LH detail layout missing or login/error response')
    return list(attachments.values()), parcels


def validate_file(data, name):
    prefix = data[:1024].lower().lstrip()
    if not data or b'<html' in prefix or prefix.startswith(b'<!doctype'):
        raise ValueError('Empty/HTML response instead of attachment')
    if name.lower().endswith('.pdf') and not data.startswith(b'%PDF'):
        raise ValueError('Invalid PDF signature')
    if name.lower().endswith('.zip') and not zipfile.is_zipfile(io.BytesIO(data)):
        raise ValueError('Invalid ZIP signature')


def download(client, item, folder, cached):
    headers = {}
    old_path = Path(cached.get('path', ''))
    if old_path.is_file() and hashlib.sha256(old_path.read_bytes()).hexdigest() == cached.get('sha256'):
        if cached.get('etag'):
            headers['If-None-Match'] = cached['etag']
        if cached.get('modified'):
            headers['If-Modified-Since'] = cached['modified']
    data, response_headers = client.get(item['url'], headers)
    if data is None:
        data = old_path.read_bytes()
    validate_file(data, item['name'])
    digest = hashlib.sha256(data).hexdigest()
    target = folder / (safe(item['id']) + '_' + digest[:12] + '_' + safe(item['name']))
    if not target.exists():
        target.write_bytes(data)
    item.update(path=str(target), sha256=digest, bytes=len(data),
                etag=response_headers.get('ETag', cached.get('etag', '')),
                modified=response_headers.get('Last-Modified', cached.get('modified', '')),
                changed=digest != cached.get('sha256'), extracted=[])
    if zipfile.is_zipfile(io.BytesIO(data)) and item['name'].lower().endswith('.zip'):
        total = 0
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            for info in archive.infolist():
                name = info.filename
                if not info.flag_bits & 0x800:
                    try:
                        name = name.encode('cp437').decode('cp949')
                    except (UnicodeError, LookupError):
                        pass
                if info.is_dir() or not re.search(r'(지침|지구단위|결정조서).*\.(pdf|hwpx?)$', name, re.I):
                    continue
                total += info.file_size
                if total > client.limit:
                    raise ValueError('Extracted ZIP exceeds maxDownloadMB')
                content = archive.read(info)
                validate_file(content, name)
                sha = hashlib.sha256(content).hexdigest()
                # Flatten paths, including Windows backslashes; never trust ZIP paths.
                path = folder / (safe(item['id']) + '_' + sha[:12] + '_' + safe(re.split(r'[/\\]', name)[-1]))
                if not path.exists():
                    path.write_bytes(content)
                item['extracted'].append(dict(name=name, path=str(path), sha256=sha, bytes=len(content)))
    return item


def validate_workbook(template, candidate, report):
    from openpyxl import load_workbook
    # Read-only validation: no spreadsheet authoring or rewriting here.
    original = load_workbook(template, data_only=False)
    updated = load_workbook(candidate, data_only=False)
    try:
        for sheet in original:
            if sheet.title not in updated.sheetnames:
                raise ValueError('Missing original sheet: ' + sheet.title)
            target = updated[sheet.title]
            for row in sheet:
                for cell in row:
                    if cell.value != target[cell.coordinate].value:
                        raise ValueError(f'Original cell changed: {sheet.title}!{cell.coordinate}')
            if {name: sheet.tables[name].ref for name in sheet.tables} != {name: target.tables[name].ref for name in target.tables}:
                raise ValueError('Original table changed: ' + sheet.title)
        if updated['자동공고'].max_row != len(report['notices']) + 6:
            raise ValueError('Exported notice row count mismatch')
    finally:
        original.close()
        updated.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, default=ROOT / 'config/regulation-refresh.local.json')
    parser.add_argument('--list-only', action='store_true')
    parser.add_argument('--limit', type=int, help='Test only N notices; never replaces latest output')
    args = parser.parse_args()
    config = json.loads(args.config.read_text(encoding='utf-8-sig'))
    if not config['enabled']:
        print('Refresh disabled')
        return
    out = resolve(config['outputDirectory'])
    out.mkdir(parents=True, exist_ok=True)
    sys.path.insert(0, str(out / 'runtime' / 'pydeps'))
    now = datetime.now(KST)
    run = out / 'runs' / now.strftime('%Y%m%d-%H%M%S-%f')
    run.mkdir(parents=True)
    try:
        client = Client(config)
        rows = listing(client, config, now.date().isoformat())
        if args.limit:
            if args.limit < 1:
                raise ValueError('--limit must be positive')
            rows = rows[:args.limit]
        report = dict(checkedAt=now.isoformat(), complete=False, notices=rows, errors=[],
                      scope={'startDate': config['startDate'], 'endDate': now.date().isoformat(), 'statuses': config['statuses']},
                      note='외부 로그인 자료 제외. PDF 규제값 자동 판독·서비스 배포 없음. 선착순 원본은 기준 엑셀 유지.')
        if args.list_only:
            write_json(run / 'listing.json', report)
            print(json.dumps({'notices': len(rows), 'listing': str(run / 'listing.json')}, ensure_ascii=False))
            return
        previous = json.loads((out / 'latest.json').read_text(encoding='utf-8')) if (out / 'latest.json').exists() else {}
        cache = {a['url']: a for n in previous.get('notices', []) for a in n.get('attachments', [])}
        for index, notice in enumerate(rows):
            try:
                notice['excluded'] = '임대 전용 (매각 수집 제외)' if ('임대' in notice['title'] and not any(word in notice['title'] for word in ['민간임대주택', '공공임대주택', '분양', '매각'])) else ''
                folder = out / '원문' / safe(notice['region']) / safe(notice['id'])
                folder.mkdir(parents=True, exist_ok=True)
                html = client.get(notice['url'])[0]
                (run / (safe(notice['id']) + '.html')).write_bytes(html)
                notice['attachments'], notice['parcels'] = parse_detail(html)
                if notice['excluded']:
                    notice['attachments'] = []
                for item in notice['attachments']:
                    try:
                        download(client, item, folder, cache.get(item['url'], {}))
                    except Exception as error:
                        item['error'] = str(error)
                        report['errors'].append({'noticeId': notice['id'], 'file': item['name'], 'error': str(error)})
            except Exception as error:
                report['errors'].append({'noticeId': notice['id'], 'error': str(error)})
            print(f"{index + 1}/{len(rows)} {notice['id']}", flush=True)
        report['complete'] = not report['errors'] and args.limit is None
        old_ids = {n['id'] for n in previous.get('notices', [])}
        report['absentNoticeIds'] = sorted(old_ids - {n['id'] for n in rows}) if report['complete'] else []
        write_json(run / 'manifest.json', report)
        if report['errors']:
            raise RuntimeError(f"{len(report['errors'])} collection errors; latest workbook retained. See {run}")
        # Run from a private runtime directory linked to the supported artifact runtime.
        runtime = out / 'runtime'
        runtime.mkdir(exist_ok=True)
        shutil.copy2(Path(__file__).with_name('build-regulation-refresh.mjs'), runtime / 'build.mjs')
        modules = runtime / 'node_modules'
        if not modules.exists():
            raise RuntimeError('Artifact runtime not configured: run register-regulation-refresh.ps1 first')
        candidate = run / 'LH_건축규제_자동갱신.xlsx'
        subprocess.run([config['nodeExecutable'], str(runtime / 'build.mjs'), str(resolve(config['workbook'])),
                        str(run / 'manifest.json'), str(candidate)], check=True)
        validate_workbook(resolve(config['workbook']), candidate, report)
        if report['complete']:
            # Publish the workbook first. A locked Excel file fails without advancing success metadata.
            temp = out / 'latest.pending.xlsx'
            shutil.copy2(candidate, temp)
            temp.replace(out / 'LH_건축규제_자동갱신.xlsx')
            write_json(out / 'latest.json', report)
            write_json(out / 'status.json', {'state': 'success', 'lastSuccess': now.isoformat(), 'run': str(run)})
        print(json.dumps({'complete': report['complete'], 'workbook': str(candidate)}, ensure_ascii=False))
    except Exception as error:
        write_json(out / 'last-error.json', {'at': now.isoformat(), 'run': str(run), 'error': str(error)})
        raise


if __name__ == '__main__':
    main()
