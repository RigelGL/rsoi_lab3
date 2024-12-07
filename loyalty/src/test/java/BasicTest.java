import org.junit.Assert;
import org.junit.Test;

public class BasicTest {
    @Test()
    public void testDiscount() {
        var s = LoyaltyService.getInstance();
        Assert.assertEquals(s.getDiscount(0), 5);
        Assert.assertEquals(s.getDiscount(9), 5);
        Assert.assertEquals(s.getDiscount(10), 7);
        Assert.assertEquals(s.getDiscount(19), 7);
        Assert.assertEquals(s.getDiscount(20), 10);
    }

    @Test()
    public void testStatus() {
        var s = LoyaltyService.getInstance();
        Assert.assertEquals(s.getStatus(0), "BRONZE");
        Assert.assertEquals(s.getStatus(9), "BRONZE");
        Assert.assertEquals(s.getStatus(10), "SILVER");
        Assert.assertEquals(s.getStatus(19), "SILVER");
        Assert.assertEquals(s.getStatus(20), "GOLD");
    }
}
