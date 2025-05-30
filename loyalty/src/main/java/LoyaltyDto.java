import java.sql.ResultSet;
import java.sql.SQLException;

public class LoyaltyDto {
    public long id;
    public String userUid;
    public String status;
    public int discount;
    public int reservationCount;

    public LoyaltyDto(String userUid) {
        id = 0;
        this.userUid = userUid;
        reservationCount = 0;
        status = "BRONZE";
        discount = 0;
    }

    public LoyaltyDto(String userUid, String status, int discount, int reservationCount) {
        this.userUid = userUid;
        this.status = status;
        this.discount = discount;
        this.reservationCount = reservationCount;
    }

    public LoyaltyDto(ResultSet rs) throws SQLException {
        id = rs.getLong("id");
        userUid = rs.getString("user_uid");
        status = rs.getString("status");
        discount = rs.getInt("discount");
        reservationCount = rs.getInt("reservation_count");
    }
}
