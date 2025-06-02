import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;

public class BasicTest {

    @BeforeClass()
    public static void setUpBeforeClass() throws Exception {
        var DB_HOST = System.getenv("DB_HOST");
        var DB_NAME = System.getenv("DB_NAME");
        var DB_USER = System.getenv("DB_USER");
        var DB_PASSWORD = System.getenv("DB_PASSWORD");

        System.out.println("DB: " + DB_HOST + "/" + DB_NAME + ", user " + DB_USER);
        JDBCConnectionPool.init(DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, 10);

        try (var reader = new FileInputStream("res/init.sql")) {
            var initSql = new String(reader.readAllBytes(), StandardCharsets.UTF_8);
            try (var con = JDBCConnectionPool.instance.getConnection()) {
                try (var p = con.prepareStatement(initSql)) {
                    p.executeUpdate();
                    System.out.println("Database updated");
                }
            }
        }
        catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    @Test()
    public void testDiscount() {
        var s = LoyaltyService.getInstance();
        Assert.assertEquals(5, s.getDiscount(0));
        Assert.assertEquals(5, s.getDiscount(9));
        Assert.assertEquals(7, s.getDiscount(10));
        Assert.assertEquals(7, s.getDiscount(19));
        Assert.assertEquals(10, s.getDiscount(20));
    }

    @Test()
    public void testStatus() {
        var s = LoyaltyService.getInstance();
        Assert.assertEquals("BRONZE", s.getStatus(0));
        Assert.assertEquals("BRONZE", s.getStatus(9));
        Assert.assertEquals("SILVER", s.getStatus(10));
        Assert.assertEquals("SILVER", s.getStatus(19));
        Assert.assertEquals("GOLD", s.getStatus(20));
    }


    @Test()
    public void testNewLoyalty() {
        var s = LoyaltyService.getInstance();
        var loyalty = s.getLoyaltyForNewUser("exa");
        Assert.assertEquals(0, loyalty.reservationCount);
        Assert.assertEquals(5, loyalty.discount);
        Assert.assertEquals("BRONZE", loyalty.status);
    }

    @Test()
    public void testGetUndefinedLoyalty() {
        var s = LoyaltyService.getInstance();
        Assert.assertNull(s.getLoyaltyForUser("undef"));
    }

    @Test()
    public void testSaveNewLoyalty() {
        var s = LoyaltyService.getInstance();
        var loyalty = s.getLoyaltyForNewUser("exa");
        loyalty.discount = 35;
        loyalty.reservationCount = 100;
        loyalty.status = s.getStatus(loyalty.reservationCount);
        Assert.assertTrue(s.addOrUpdateLoyalty("exa", loyalty));

        loyalty = s.getLoyaltyForUser("exa");
        Assert.assertEquals(100, loyalty.reservationCount);
        Assert.assertEquals(35, loyalty.discount);
        Assert.assertEquals("GOLD", loyalty.status);
    }
}
