import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
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
            // ranking file
//            List<String> queryList = Arrays.asList("hurricane isabel damage", "forecast models",
//                    "green energy canada", "heavy rains", "hurricane music lyrics", "accumulated snow", "snow accumulation",
//                    "massive blizzards blizzard", "new york city subway");
            List<String> queryList = Arrays.asList("accumulated snow");

            System.out.println("28 " + avdl);
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
//        Scanner dfIn = new Scanner(new File("df-unigram.txt"), "utf-8");
//        while (dfIn.hasNext()) {
//            String str = dfIn.next();
//            int df = dfIn.nextInt();
//            String s = dfIn.next();
//            while (!s.equals(")")) {
//                s = dfIn.next();
//            }
//            dfList.add(new strNum(str, df));
//        }

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
        PriorityQueue<docScore> heap = new PriorityQueue<>(resultNum);
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
                docSet
            }
            System.out.println(q[i] + " : term frequency is " + qf[i] + ", df is " + n[i]);
        }

        // count document BM25 score
        for (int i = 0; i < docNum; i++) {
            double score = 0;
            double K = k1 * ((1 - b) + b * ((double)dl[i] / (double)avdl));
            System.out.println("Document " + (i + 1) + " K = " + K);
            for (int j = 0; j < q.length; j++) {
                List<int[]> list = r[j].list;
                int fi = 0; // term frequency in this document
                for (int[] arr: list) {
                    if (arr[0] == i + 1) {
                        fi = arr[1];
                        break;
                    }
                }
                if (fi != 0) {
                    score += Math.log(((ri + 0.5) / (R - ri + 0.5)) / ((n[j] - ri + 0.5) / (N - n[j] - R + ri + 0.5)))
                            * ((k1 + 1) * fi / (K + fi)) * ((k2 + 1) * qf[j] / (k2 + qf[j]));
//                    score += Math.log10((1 / ((n[j] + 0.5) / (N - n[j] + 0.5)))
//                            * ((k1 + 1) * fi / (K + fi)) * ((k2 + 1) * qf[j] / (k2 + qf[j])));
                }
                System.out.println((i + 1) + ": " + q[j] + " , fi is " + fi + " , doc length is " + dl[i] + " score is " + score);
            }

            if (heap.size() < resultNum) {
                heap.offer(new docScore(i + 1, score));
            } else if (score > heap.peek().score) {
                heap.poll();
                heap.offer(new docScore(i + 1, score));
            }
        }


        /// output result
        docScore[] res = new docScore[resultNum];
        for (int i = resultNum - 1; i >= 0; i--){
            res[i] = heap.poll();
        }
        try {
            PrintWriter out = new PrintWriter(new File(outFileName));
            for (int i = 0; i < resultNum; i++) {
                out.println(index + " Q0 " + res[i].docId + " "
                        + (i + 1) + " " + res[i].score + " Yuqing_RModel");
//                System.out.println((i + 1) + ". " + index + " " + res[i].docId + " scored: " + res[i].score);
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
