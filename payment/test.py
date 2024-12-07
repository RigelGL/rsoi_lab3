import unittest

from dotenv import load_dotenv
from dba import Dba
import random, string, os


class TestDao(unittest.TestCase):
    dba: Dba = None
    _database_name = None

    @classmethod
    def setUpClass(cls):
        load_dotenv()
        DB_HOST = os.getenv('DB_HOST')
        DB_USER = os.getenv('DB_USER')
        DB_PASSWORD = os.getenv('DB_PASSWORD')

        TestDao._database_name = 'payment_test_' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))

        if not Dba.create_test_database(TestDao._database_name, host=DB_HOST, user=DB_USER, password=DB_PASSWORD):
            print('Error creating database')
            return False
        print('Created database {}'.format(TestDao._database_name))

        TestDao.dba = Dba(name=TestDao._database_name, host=DB_HOST, user=DB_USER, password=DB_PASSWORD)
        TestDao.dba.init_database()

    @classmethod
    def tearDownClass(cls):
        DB_HOST = os.getenv('DB_HOST')
        DB_USER = os.getenv('DB_USER')
        DB_PASSWORD = os.getenv('DB_PASSWORD')

        if not Dba.drop_test_database(TestDao._database_name, host=DB_HOST, user=DB_USER, password=DB_PASSWORD):
            print('Error drop database')
        else:
            print('Dropped database {}'.format(TestDao._database_name))

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
