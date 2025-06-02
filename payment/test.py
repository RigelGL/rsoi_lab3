import unittest

from dotenv import load_dotenv
from dba import Dba
import random, string, os


class TestDao(unittest.TestCase):
    dba: Dba = None

    @classmethod
    def setUpClass(cls):
        load_dotenv()
        DB_NAME = os.getenv('DB_NAME')
        DB_HOST = os.getenv('DB_HOST')
        DB_USER = os.getenv('DB_USER')
        DB_PASSWORD = os.getenv('DB_PASSWORD')

        TestDao.dba = Dba(name=DB_NAME, host=DB_HOST, user=DB_USER, password=DB_PASSWORD)
        TestDao.dba.init_database()

    def test_not_found(self):
        self.assertEqual(TestDao.dba.get_payment('unef'), None, 'Should be None')

    def test_add(self):
        uid = TestDao.dba.add_payment(90)
        self.assertIsNotNone(uid, 'Should be not None')

        e = TestDao.dba.get_payment(uid)
        self.assertIsNotNone(e, 'Should not be None')
        self.assertEqual(e['uid'], uid, 'Invalid uid')
        self.assertEqual(e['price'], 90, 'Should be 90')
        self.assertEqual(e['status'], 'PAID', 'Should be PAID')

    def test_cancel(self):
        uid = TestDao.dba.add_payment(180)
        TestDao.dba.cancel_payment(uid)
        e = TestDao.dba.get_payment(uid)
        self.assertIsNotNone(e, 'Should not be None')
        self.assertEqual(e['uid'], uid, 'Invalid uid')
        self.assertEqual(e['price'], 180, 'Should be 90')
        self.assertEqual(e['status'], 'CANCELED', 'Should be CANCELED')


if __name__ == '__main__':
    unittest.main()
