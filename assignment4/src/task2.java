import java.io.*;
import java.util.*;

public class task2 {
    private List<strNum> dfList;
    private List<record> tfList;
    private int avdl;
    private int[] dl;
    private int docNum = 1000;


    public static void main(String[] args) {
        (new task2()).mockMain();
    }

    public void mockMain() {
        try {
            createDfTfTable();
            docLengthCounter();

//            List<String> queryList = Arrays.asList("hurricane isabel damage", "forecast models",
//                    "green energy canada", "heavy rains", "hurricane music lyrics", "accumulated snow", "snow accumulation",
//                    "massive blizzards blizzard", "new york city subway");
            List<String> queryList = Arrays.asList("accumulated snow");

            System.out.println("AVDL is " + avdl);
            // ranking file
            for (int i = 0; i < queryList.size(); i++) {
                String q = queryList.get(i);
                String fileName = q.replaceAll(" ","_") + "_task2.txt";
                BM25Ranking(i + 1, q.split(" "), 100, "./docs/" + fileName);
            }
        } catch (Exception e) {
            System.out.println("Unable to create Df Tf table");
            e.printStackTrace();
        }
    }


    public void createDfTfTable() throws IOException{
        dfList = new ArrayList<>();
        tfList = new ArrayList<>();

        Scanner in = new Scanner(new File("unigram.txt"), "utf-8");
        String buffer = "";

        while (in.hasNext()) {
            String s = "";
            buffer = in.next();
            while (!buffer.equals("->")) {
                s += buffer + " ";
                buffer = in.next();
            }
            s = s.substring(0, s.length() - 1);

            List<int[]> list = new ArrayList<>();
            buffer = in.next(); // will be (
            while (!buffer.equals(".")) {
                int[] arr = new int[2];

                arr[0] = in.nextInt();

                in.next(); // remove ,
                arr[1] = in.nextInt();
                in.next();
                buffer = in.next(); // remove ( or .
                list.add(arr);
            }

            tfList.add(new record(s, list));
            dfList.add(new strNum(s, list.size()));
        }
//        String s = "";
//        while (!s.equals("q")) {
//            System.out.println("Enter term to check for tf and df");
//            BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
//            s = br.readLine();
//            if (s.equals("q")) {
//                break;
//            }
//            int location = Collections.binarySearch(dfList, new strNum(s, 0), Comparator.comparing(a -> a.str));
//            int rLoc = Collections.binarySearch(tfList, new record(s, new ArrayList<>()), Comparator.comparing(a -> a.term));
//            System.out.println("Term: " + s + ", df is " + dfList.get(location).num);
//            System.out.print("Inverted List is ");
//            List<int[]> list = tfList.get(rLoc).list;
//            for (int[] arr: list) {
//                System.out.print("(" + arr[0] + ", " + arr[1] + ") ");
//            }
//        }
        in.close();
    }

    public void docLengthCounter() {
        String dirName = "./task1/";
        dl = new int[docNum];
        int dlSum = 0;
        for (int i = 0; i < docNum; i++) {
            String fileName = (i + 1) + ".txt";
            try {
                Scanner in = new Scanner(new File(dirName + fileName));
                while (in.hasNext()) {
                    dl[i]++;
                    dlSum++;
                    in.next();
                }
            } catch (Exception e) {
                System.out.println("Could not read: " + dirName + fileName);
                break;
            }
        }
        this.avdl = dlSum / docNum;
    }

    public void BM25Ranking (int index, String[] q, int resultNum, String outFileName){
        System.out.println(q);
        List<docScore> scoreList = new ArrayList<>();
        double k1 = 1.2;
        double b = 0.75;
        double k2 = 100;
        double R = 0;
        double ri = 0;
        double N = docNum;
        Set<Integer> docSet = new HashSet<>();

        int[] n = new int[q.length]; // query term document frequency
        int[] qf = new int[q.length]; // query term frequency
        record[] r = new record[q.length]; // query inverted list

        // Count query based ni value and retrieve the inverted list related to query (r[i])
        for (int i = 0; i < q.length; i++) {
            // Because dfList are created in lexi order
            int location = Collections.binarySearch(dfList, new strNum(q[i], 0), Comparator.comparing(a -> a.str));
            n[i] = dfList.get(location).num;

            for (int j = 0; j < q.length; j++) {
                if (q[i].equals(q[j])) {
                    qf[i]++;
                }
            }

            int rLoc = Collections.binarySearch(tfList, new record(q[i], new ArrayList<>()), Comparator.comparing(a -> a.term));
            r[i] = tfList.get(rLoc);

            for (int[] arr : r[i].list) {
                docSet.add(arr[0]);
            }
            System.out.println(q[i] + " : term frequency is " + qf[i] + ", df is " + n[i]);
        }

        for (Integer i: docSet) {
            System.out.print(i + " ");
        }

        // count document BM25 score
        // docId starting from 1
        for (Integer i : docSet) {
            double score = 0;
            double K = k1 * ((1 - b) + b * ((double)dl[i - 1] / (double)avdl));
            System.out.println("Document " + i + " K = " + K);
            for (int j = 0; j < q.length; j++) {
                List<int[]> list = r[j].list;
                int fi = 0; // term frequency in this document
                for (int[] arr: list) {
                    if (arr[0] == i) {
                        fi = arr[1];
                        break;
                    }
                }
                if (fi != 0) {
                    score += Math.log(((ri + 0.5) / (R - ri + 0.5)) / ((n[j] - ri + 0.5) / (N - n[j] - R + ri + 0.5)))
                            * ((k1 + 1) * fi / (K + fi)) * ((k2 + 1) * qf[j] / (k2 + qf[j]));
                }
                System.out.println(i + ": " + q[j] + " , fi is " + fi + " , doc length is " + dl[i - 1] + " score is " + score);
            }

            scoreList.add(new docScore(i, score));
        }


        /// output result
        scoreList.sort(Comparator.comparing(a -> -a.score));
        try {
            PrintWriter out = new PrintWriter(new File(outFileName));
            for (int i = 0; i < resultNum && i < scoreList.size(); i++) {
                docScore ith = scoreList.get(i);
                out.println(index + " Q0 " + ith.docId + " "
                        + (i + 1) + " " + ith.score+ " Yuqing_RModel");
            }
            out.close();
        } catch (Exception e) {
            System.out.println("Could not write " + outFileName);
        }

    }
    private class strNum {
        String str;
        int num;
        
        strNum(String str, int num) {
            this.str = str;
            this.num = num;
        }
    }

    private class docScore implements Comparable<docScore> {
        int docId;
        double score;

        docScore(int docId, double score) {
            this.docId = docId;
            this.score = score;
        }

        @Override
        public int compareTo(docScore other){
            if (this.score > other.score) {
                return 1;
            } else if (this.score == other.score) {
                return 0;
            } else {
                return -1;
            }
        }
    }

    private class record {
        String term;
        List<int[]> list; // int[0] is the docID, int[1] is the tf

        public record(String term, List<int[]> list) {
            this.term = term;
            this.list = list;
        }


        // Use for test
        @Override
        public String toString() {
            String res = "";
            res += term + " -> ";
            for (int j = 0; j < list.size(); j++) {
                int[] arr = list.get(j);
                res += "( " + arr[0] + " , " + arr[1] + " ) ";
            }
            return res;
        }
    }
}
