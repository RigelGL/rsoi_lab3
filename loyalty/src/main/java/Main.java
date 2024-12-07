import com.sun.net.httpserver.HttpServer;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static Map<String, String> parseQuery(String query) {
        Map<String, String> result = new HashMap<>();
        if (query == null)
            return result;
        for (String param : query.split("&")) {
            String[] entry = param.split("=");
            if (entry.length > 1)
                result.put(URLDecoder.decode(entry[0], StandardCharsets.UTF_8), URLDecoder.decode(entry[1], StandardCharsets.UTF_8));
            else
                result.put(URLDecoder.decode(entry[0], StandardCharsets.UTF_8), "");
        }
        return result;
    }

    public static void main(String[] args) throws IOException, ClassNotFoundException {
        Map<String, String> dotEnv = new HashMap<>();
        try (var reader = new BufferedReader(new FileReader(".env"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                var sep = line.split(" *= *");
                if (sep.length == 2)
                    dotEnv.put(sep[0], sep[1]);
            }
        } catch (Exception e) {
            System.out.println(".env file not found. Using system environment variables");
        }

        String DB_HOST = System.getenv("DB_HOST");
        String DB_NAME = System.getenv("DB_NAME");
        String DB_USER = System.getenv("DB_USER");
        String DB_PASSWORD = System.getenv("DB_PASSWORD");

        if (DB_HOST == null) DB_HOST = dotEnv.get("DB_HOST");
        if (DB_NAME == null) DB_NAME = dotEnv.get("DB_NAME");
        if (DB_USER == null) DB_USER = dotEnv.get("DB_USER");
        if (DB_PASSWORD == null) DB_PASSWORD = dotEnv.get("DB_PASSWORD");

        System.out.println("DB: " + DB_HOST + "/" + DB_NAME + ", user " + DB_USER);

        int port = 8050;
        try {
            var s = System.getenv("APP_PORT");
            if (s == null) s = dotEnv.get("APP_PORT");
            port = Integer.parseInt(s);
        } catch (NumberFormatException ignored) {
        }

        System.out.println("Loyalty starts on " + port);

        JDBCConnectionPool.init(DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, 10);

        try (var reader = new FileInputStream("res/init.sql")) {
            var initSql = new String(reader.readAllBytes(), StandardCharsets.UTF_8);

            try (var con = JDBCConnectionPool.instance.getConnection()) {
                try (var p = con.prepareStatement(initSql)) {
                    p.executeUpdate();
                    System.out.println("Database updated");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        var server = HttpServer.create(new InetSocketAddress(port), 0);
        server.setExecutor(null);
        server.createContext("/loyalty").setHandler(t -> {
            if (!t.getRequestMethod().equals("GET")) {
                t.close();
                return;
            }

            try {
                var query = parseQuery(t.getRequestURI().getQuery());
                var userName = query.getOrDefault("name", null);
                var loyalty = LoyaltyService.getInstance().getLoyaltyForUser(userName);

                if (loyalty == null)
                    loyalty = LoyaltyService.getInstance().getLoyaltyForNewUser(userName);

                // Fastest json serialization go brrrr
                String json = "{\"status\":\"" + loyalty.status
                        + "\",\"discount\":" + loyalty.discount
                        + ",\"reservationCount\":" + loyalty.reservationCount
                        + "}";

                System.out.println(json);

                var b = json.getBytes(StandardCharsets.UTF_8);
                t.sendResponseHeaders(200, b.length);
                t.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
                var os = t.getResponseBody();
                os.write(b);
                os.close();
            } catch (Exception e) {
                e.printStackTrace();
                t.close();
            }
        });

        server.createContext("/update").setHandler(t -> {
            if (!t.getRequestMethod().equals("POST")) {
                t.close();
                return;
            }

            try {
                var query = parseQuery(t.getRequestURI().getQuery());
                var userName = query.getOrDefault("name", null);
                var type = query.getOrDefault("type", "none");

                if (!"inc".equals(type) && !"dec".equals(type) && !"none".equals(type)) {
                    var resp = "invalid type".getBytes(StandardCharsets.US_ASCII);
                    t.sendResponseHeaders(400, resp.length);
                    var o = t.getResponseBody();
                    o.write(resp);
                    o.close();
                    return;
                }

                var ok = LoyaltyService.getInstance().updateLoyalty(userName, type);
                t.sendResponseHeaders(ok ? 200 : 500, 0);
                t.close();
            } catch (Exception e) {
                e.printStackTrace();
                t.close();
            }
        });

        server.createContext("/force").setHandler(t -> {
            if (!t.getRequestMethod().equals("POST")) {
                t.close();
                return;
            }

            try {
                var query = parseQuery(t.getRequestURI().getQuery());
                var userName = query.getOrDefault("name", null);
                int reservations = Integer.parseInt(query.getOrDefault("reservations", "0"));
                int discount = Integer.parseInt(query.getOrDefault("discount", "0"));
                var status = query.getOrDefault("status", null);

                var ok = LoyaltyService.getInstance().addOrUpdateLoyalty(userName, new LoyaltyDto(userName, status, discount, reservations));
                t.sendResponseHeaders(ok ? 200 : 500, 0);
                t.close();
            } catch (Exception e) {
                e.printStackTrace();
                t.close();
            }
        });

        server.createContext("/manage/health").setHandler(t -> {
            var response = "OK".getBytes(StandardCharsets.US_ASCII);
            t.sendResponseHeaders(200, response.length);
            t.getResponseBody().write(response);
            t.close();
        });

        server.start();
        System.out.println("ready");
    }
}
