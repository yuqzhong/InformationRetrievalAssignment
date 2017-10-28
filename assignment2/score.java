import java.lang.*;
import java.util.*;
import java.io.*;

public class score {
	public static void main(String[] args) throws IOException{
		System.out.println("Deal with dfs result or bfs? (input dfs or bfs)");
		Scanner in = new Scanner(System.in);
		String method = in.next();
		(new score()).mockMain(method);
		in.close();
	}

	public void mockMain(String method) throws IOException{
		List<Pair> list = rank(method);
		PrintWriter out = new PrintWriter(new File(method + "rankingResult.txt"));
		for (Pair p : list) {
			System.out.println(p.document + " " + p.pr);
			out.println(p.document + " " + p.pr);
		}
		out.close();
	}

	public List<Pair> rank(String method) throws IOException{
		Scanner inLinkIn = new Scanner(new File(method + "InLink.txt"));
		Scanner outLinkIn = new Scanner(new File(method + "OutLink.txt"));
		Scanner namesIn = new Scanner(new File(method + "Index.txt"));


		// Store all document index in pages
		List<String> terms = new ArrayList<>();

		// for (char i = 'a'; i <= 'f'; i++) {
		// 	terms.add(Character.toString(i));
		// }

		while (namesIn.hasNext()) {
			namesIn.next();
			terms.add(namesIn.next().toLowerCase());
		}

		System.out.println("finish terms");

		int N = terms.size();

		// Build the in-link map
		HashMap<String, Set<String>> inMap = new HashMap<>();

		inLinkIn.next(); // remove first "|"
		while (inLinkIn.hasNext()) {
			String dID = inLinkIn.next().toLowerCase();
			Set<String> fromSet = new HashSet<>();

			String from = "|";
			if (inLinkIn.hasNext()) {
				from = inLinkIn.next().toLowerCase();
			}

			while (!from.equals("|")) {
				System.out.println(from + " ");
				fromSet.add(from);
				if (!inLinkIn.hasNext()) {
					break;
				}
				from = inLinkIn.next().toLowerCase();
			}


			inMap.put(dID, fromSet);
		}

		System.out.println("finish inlink");

		for (int i = 0; i < terms.size(); i++) {
			System.out.print(terms.get(i) + " ");
			for (String s : inMap.get(terms.get(i))) {
				System.out.print(s + " ");
			}
			System.out.println();
		}

		// Build the out-link map and store sinks
		List<String> sinks = new ArrayList<>();
		HashMap<String, Set<String>> outMap = new HashMap<>();
		outLinkIn.next(); // remove first "|"
		while (outLinkIn.hasNext()) {
			String dID = outLinkIn.next().toLowerCase();
			Set<String> toSet = new HashSet<>();

			String to = "|";
			if (outLinkIn.hasNext()) {
				to = outLinkIn.next().toLowerCase();
			}
			

			while (!to.equals("|")) {
				toSet.add(to);
				if (!outLinkIn.hasNext()) {
					break;
				}
				to = outLinkIn.next().toLowerCase();
			}

			outMap.put(dID, toSet);
			if (toSet.size() == 0) {
				sinks.add(dID);
			}
		}

		System.out.println("finish outLink");

		// Init every PR to 1/N and store in prMap
		HashMap<String, Double> prMap = new HashMap<>();
		double initScore = 1.0 / N;
		for (String p: terms) {
			prMap.put(p, initScore);
			// System.out.println(p + " " + initScore);
		}

		double d = 0.85;
		
		int count = 0;
		int round = 0;
		// try to converge
		double oldPerp = -1;
		while (count < 4) {
			round++;
			HashMap<String, Double> roundPRs = new HashMap<>();

			double hpr = 0.0;
			// double perp = 1.0;
			double sinkPR = 0.0;
			for (String s : sinks) {
				sinkPR += prMap.get(s);
			}
			// System.out.println(sinkPR);

			for (String p: terms) {
				double newPR = (1.0 - d) / N;

				newPR += d * sinkPR / N;

				for (String q: inMap.get(p)) {
					newPR += d * prMap.get(q) / outMap.get(q).size();
				}
				roundPRs.put(p, newPR);
				// System.out.println(p + " " + newPR);
				hpr -= newPR * Math.log(newPR) / Math.log(2);
				// perp *= Math.pow(newPR, -newPR);
			}
			// System.out.println(perp < 1);

			double perp = Math.pow(2.0, hpr);
			if (Math.abs(oldPerp - perp) < 1) {
				count++;
			} else {
				count = 0;
			}
			oldPerp = perp;


			for (String p: terms) {
				// System.out.println("Dif for " + p + " is " + (prMap.get(p) - roundPRs.get(p)));
				prMap.put(p, roundPRs.get(p));
			}

			System.out.println("--------------------------------------- " + perp + " " + count);

		}

		// output rank
		List<Pair> scores = new ArrayList<>();
		for (String p: terms) {
			scores.add(new Pair(p, prMap.get(p)));
		} 

		Collections.sort(scores, new Comparator<Pair>() {
			@Override
			public int compare(Pair a, Pair b) {
				double dif = b.pr - a.pr;
				if (dif > 0) {
					return 1;
				} else if (dif == 0) {
					return 0;
				}
				return -1;
			}
		});

		return scores;
	}

	public class Pair {
		String document;
		double pr;

		public Pair(String d, double pr) {
			this.document = d;
			this.pr = pr;
		}
	}
}