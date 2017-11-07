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
			// System.out.println(p.document + " " + p.pr);
			out.println(p.document + " " + p.pr);
		}
		out.close();
	}

	public List<Pair> rank(String method) throws IOException{
		Scanner inLinkIn = new Scanner(new File(method + "InLink.txt"));
		Scanner outLinkIn = new Scanner(new File(method + "OutLink.txt"));
		Scanner namesIn = new Scanner(new File(method + "Index.txt"));

		PrintWriter perpOut = new PrintWriter(new File(method + "Perplexity.txt"));


		// Store all document index in pages
		List<String> terms = new ArrayList<>();

		while (namesIn.hasNext()) {
			namesIn.next();
			terms.add(namesIn.next().toLowerCase());
		}

		System.out.println("finish terms");

		int N = terms.size();

		// Build the in-link map
		HashMap<String, Set<String>> inMap = new HashMap<>();
		int sourcesCount = 0;

		inLinkIn.next(); // remove first "|"
		while (inLinkIn.hasNext()) {
			String dID = inLinkIn.next().toLowerCase();
			Set<String> fromSet = new HashSet<>();

			String from = "|";
			if (inLinkIn.hasNext()) {
				from = inLinkIn.next().toLowerCase();
			}

			while (!from.equals("|")) {
				fromSet.add(from);
				if (!inLinkIn.hasNext()) {
					break;
				}
				from = inLinkIn.next().toLowerCase();
			}


			inMap.put(dID, fromSet);
			if (fromSet.size() == 0) {
				sourcesCount++;
			}
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

		///////////////////// Start of PageRank part////////////////////////////////////////////
		// Init every PR to 1/N and store in prMap
		HashMap<String, Double> prMap = new HashMap<>();
		double initScore = 1.0 / N;
		for (String p: terms) {
			prMap.put(p, initScore);
		}
		System.out.println(sourcesCount + " " + sinks.size());

		double d = 0.85;
		
		int count = 0;
		int round = 0;
		double oldPerp = -1;

		while (count < 4) {
			round++;
			HashMap<String, Double> roundPRs = new HashMap<>();

			double hpr = 0.0;
			double sinkPR = 0.0;
			for (String s : sinks) {
				sinkPR += prMap.get(s);
			}

			for (String p: terms) {
				double newPR = (1.0 - d) / N;

				newPR += d * sinkPR / N;

				for (String q: inMap.get(p)) {
					newPR += d * prMap.get(q) / outMap.get(q).size();
				}
				roundPRs.put(p, newPR);
				hpr -= newPR * Math.log(newPR) / Math.log(2);
			}

			double perp = Math.pow(2.0, hpr);
			if (Math.abs(oldPerp - perp) < 1) {
				count++;
			} else {
				count = 0;
			}
			oldPerp = perp;


			for (String p: terms) {
				prMap.put(p, roundPRs.get(p));
			}

			// output perplexity for this round
			perpOut.println(round + ": " + perp);

		}
		perpOut.close();

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