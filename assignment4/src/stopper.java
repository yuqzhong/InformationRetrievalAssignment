import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * Created by alice on 2017/11/26.
 */
public class stopper {
    public static void main(String[] args) throws IOException {
        System.out
                .println("Enter the FULL path where the index will be created: (e.g. /Usr/index or c:\\temp\\index)");

        String indexLocation = null;
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();

        HW4 indexer = null;
        try {
            indexLocation = s;
//            indexer = new HW4(s);
        } catch (Exception ex) {
            System.out.println("Cannot create index..." + ex.getMessage());
            System.exit(-1);
        }
    }
}
