import java.sql.SQLException;

public class LoyaltyService {
    private static final LoyaltyService instance = new LoyaltyService();

    private LoyaltyService() {
    }

    public static LoyaltyService getInstance() {
        return instance;
    }

    public LoyaltyDto getLoyaltyForUser(String user) {
        try (var con = JDBCConnectionPool.instance.getConnection()) {
            try (var p = con.prepareStatement("SELECT * FROM loyalty WHERE username = ?")) {
                p.setString(1, user);
                var rs = p.executeQuery();
                if (rs.next())
                    return new LoyaltyDto(rs);
            }
        } catch (SQLException ignored) {
        }
        return null;
    }


    public boolean addOrUpdateLoyalty(String user, LoyaltyDto loyalty) {
        try (var con = JDBCConnectionPool.instance.getConnection()) {
            try (var p = con.prepareStatement(
                    """
                            INSERT INTO loyalty (username, reservation_count, status, discount)
                            VALUES (?, ?, ?, ?)
                            ON CONFLICT (username) DO UPDATE SET
                              reservation_count = excluded.reservation_count,
                              status = excluded.status,
                              discount = excluded.discount
                            """)) {
                p.setString(1, user);
                p.setInt(2, loyalty.reservationCount);
                p.setString(3, loyalty.status);
                p.setInt(4, loyalty.discount);
                p.executeUpdate();
                return true;
            }
        } catch (SQLException ignored) {
            ignored.printStackTrace();
        }
        return false;
    }

    public boolean updateLoyalty(String user, String type) {
        var dbLoyalty = getLoyaltyForUser(user);
        var loyalty = dbLoyalty;

        if (loyalty == null)
            loyalty = new LoyaltyDto(user);

        if ("inc".equals(type))
            loyalty.reservationCount++;
        else if ("dec".equals(type))
            loyalty.reservationCount = Math.max(0, loyalty.reservationCount - 1);
        // если не изменяем статус
        else if (dbLoyalty != null)
            return true;

        loyalty.status = getStatus(loyalty.reservationCount);
        loyalty.discount = getDiscount(loyalty.reservationCount);
        return addOrUpdateLoyalty(user, loyalty);
    }


    public LoyaltyDto getLoyaltyForNewUser(String name) {
        var loyalty = new LoyaltyDto(name);
        loyalty.status = getStatus(loyalty.reservationCount);
        loyalty.discount = getDiscount(loyalty.reservationCount);
        return loyalty;
    }

    public String getStatus(int count) {
        if (count >= 20)
            return "GOLD";
        if (count >= 10)
            return "SILVER";
        return "BRONZE";
    }

    public int getDiscount(int count) {
        if (count >= 20)
            return 10;
        if (count >= 10)
            return 7;
        return 5;
    }
}
