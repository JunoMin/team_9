"""Run with the collector's Python dependencies on PYTHONPATH."""
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('refresh', Path(__file__).parents[1] / 'scripts/refresh-regulations.py')
refresh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)


def page(ids, total=2, status='공고중'):
    rows = ''.join(f'<tr><td></td><td><a class="wrtancInfoBtn" data-id1="{i}" data-id2="01" data-id3="01" data-id4="05">공고</a></td><td></td><td>경기</td><td></td><td>2026.11.13</td><td></td><td>{status}</td></tr>' for i in ids)
    return f'<div class="bbs_total">전체 {total}건</div><table>{rows}</table>'.encode()


class RefreshTests(unittest.TestCase):
    def test_all_pages_and_statuses(self):
        class Client:
            def __init__(self): self.pages = iter([page(['a']), page(['b']), page(['c'], 1, '상담요청')])
            def get(self, *_): return next(self.pages), {}
        rows = refresh.listing(Client(), {'statuses': ['공고중','상담요청'], 'startDate': '1900-01-01'}, '2026-11-13')
        self.assertEqual({r['id'] for r in rows}, {'a','b','c'})

    def test_repeated_page_fails(self):
        class Client:
            def get(self, *_): return page(['a']), {}
        with self.assertRaisesRegex(ValueError, 'Repeated'):
            refresh.listing(Client(), {'statuses':['공고중'], 'startDate':'1900-01-01'}, '2026-11-13')

    def test_layout_change_fails(self):
        with self.assertRaises(ValueError): refresh.parse_listing(b'<html>login</html>')
        with self.assertRaises(ValueError): refresh.parse_detail(b'<html>error</html>')

    def test_false_pdf_fails(self):
        with self.assertRaises(ValueError): refresh.validate_file(b'<html>login</html>', '지침.pdf')
        with self.assertRaises(ValueError): refresh.validate_file(b'not pdf', '지침.pdf')

    def test_zip_paths_are_flattened(self):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w') as archive:
            archive.writestr('../../지침.pdf', b'%PDF-test')
        class Client:
            limit = 1024 * 1024
            def get(self, *_): return buf.getvalue(), {}
        with tempfile.TemporaryDirectory() as folder:
            item = refresh.download(Client(), {'id':'1','name':'자료.zip','url':refresh.BASE+'/file'}, Path(folder), {})
            self.assertEqual(Path(item['extracted'][0]['path']).parent, Path(folder))
            self.assertTrue(item['changed'])

    def test_same_file_id_changed_content_is_detected(self):
        class Client:
            limit = 1024
            def get(self, *_): return b'%PDF-new', {}
        with tempfile.TemporaryDirectory() as folder:
            item = refresh.download(Client(), {'id':'1','name':'지침.pdf','url':refresh.BASE+'/file'}, Path(folder), {'sha256':'old'})
            self.assertTrue(item['changed'])
            self.assertEqual(Path(item['path']).read_bytes(), b'%PDF-new')


if __name__ == '__main__':
    unittest.main()
