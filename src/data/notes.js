// ===========================================================================
//  ENGINEERING NOTES — short write-ups of problems you have actually solved.
//
//  This is the section that closes the DSA gap. A LeetCode link proves you
//  have an account; a write-up proves you can reason about complexity and
//  explain a decision, which is what an interviewer is actually screening for.
//
//  The section is switched OFF in src/config/site.js until there are at least
//  two entries here -- one lonely note looks worse than none.
//  Turn it on with:  { id: 'notes', enabled: true, nav: 'Notes' }
//
//  FIELD REFERENCE
//  title       required  the problem, in your own words
//  tags        required  e.g. ['Graphs', 'Binary search']
//  naive       required  the obvious approach and its complexity
//  whyItFails  required  the specific reason the obvious approach breaks
//  approach    required  what you did instead, and why it works
//  complexity  required  { time, space }
//  code        optional  a short C++ excerpt -- the core loop, not the whole file
//  link        optional  problem URL or your solution
// ===========================================================================

export const notes = [
  // ---------------------------------------------------------------------
  // TEMPLATE — copy this, fill it in, delete this comment.
  // Keep `naive` and `whyItFails` honest and specific. "It is slow" says
  // nothing; "it re-sorts inside the loop, so it is O(n^2 log n)" says a lot.
  // ---------------------------------------------------------------------
  // {
  //   title: 'Shortest path with one edge you may halve',
  //   tags: ['Graphs', 'Dijkstra', 'State-space search'],
  //   naive:
  //     'Run Dijkstra once per candidate edge, halving that edge each time. O(E) runs of O(E log V).',
  //   whyItFails:
  //     'The candidate set is every edge, so the cost multiplies by E and it times out past a few thousand edges. It also recomputes almost identical shortest-path trees each run.',
  //   approach:
  //     'Duplicate the graph into two layers: layer 0 is "discount unused", layer 1 is "discount already spent". A halved edge moves you from layer 0 to layer 1. One Dijkstra over the doubled graph answers the whole question, because the layer index carries the state the naive version was re-deriving.',
  //   complexity: { time: 'O(E log V)', space: 'O(V + E)' },
  //   code: `// two layers: node u in layer L is encoded as u + L * n
  // pq.push({0, src});
  // while (!pq.empty()) {
  //     auto [d, u] = pq.top(); pq.pop();
  //     if (d > dist[u]) continue;
  //     for (auto [v, w] : adj[u % n]) {
  //         relax(u, v, w);                    // stay in this layer
  //         if (u < n) relax(u, v + n, w / 2); // spend the discount
  //     }
  // }`,
  //   link: 'https://leetcode.com/u/mdhumayun7/',
  // },
  {
    title: 'Why accuracy is the wrong headline for an intrusion prevention system',
    tags: ['Evaluation', 'Intrusion prevention', 'Class imbalance'],
    naive:
      'Train a classifier on CICIDS2017, report accuracy, and pick the class with the highest probability for every flow.',
    whyItFails:
      'On the same data, a model that predicts "benign" for every flow scores 82.96% accuracy and detects nothing. Accuracy rewards the majority class. And an inline system executes its own predictions, so a false positive is not a ticket for someone to dismiss: it drops a legitimate connection.',
    approach:
      'Make recall and false alarm rate the headline numbers and replace argmax with three outcomes: ALLOW, UNCERTAIN and BLOCK. Choose the operating point by sweeping the allow threshold against a stated 1% false-alarm budget. At threshold 0.38 the ensemble detects 99.99% of attack flows at a 0.9% false alarm rate; at 0.95 it trades down to 97.66% detection for a 0.065% false alarm rate. The right point depends on what a dropped connection costs, which is a deployment decision and not a modelling one.',
    link: 'https://github.com/mdhumayun7/ips',
  },
  {
    title: 'An alarm loop that cannot wait on Wi-Fi',
    tags: ['Embedded', 'FreeRTOS', 'ESP32', 'Concurrency'],
    naive:
      'One Arduino loop that reads the sensors, sleeps with delay(), and sends the notification over the network in the same pass.',
    whyItFails:
      'Version 1 of this project did exactly that and froze for five seconds on every alarm. Any slow DNS lookup, TCP call or broker reconnect in that loop stalls the siren, the LEDs and the sensor scan with it. For a security device the part that decides must never wait on the part that reports.',
    approach:
      'Split the firmware across the ESP32 cores. The safety loop runs on core 1 and only touches GPIO and memory, with no blocking delay(). Wi-Fi, NTP and MQTT run as a FreeRTOS task on core 0. The two halves share nothing except two queues, a 16-deep event queue and a 4-deep command queue. Events raised while offline wait in the queue and are delivered in order after reconnect, and an overflow is counted instead of hidden. The state machine is tested on the host in CI at three millis() start values, including 32-bit wrap-around.',
    code: `eventQ = xQueueCreate(16, sizeof(Event));
cmdQ   = xQueueCreate(4,  sizeof(Cmd));
// network task pinned to core 0; the Arduino loop stays on core 1
xTaskCreatePinnedToCore(networkTask, "net", 8192, nullptr, 1, nullptr, 0);`,
    link: 'https://github.com/mdhumayun7/Smart-Home-Automation',
  },
  {
    title: 'The no-program baseline that beat the method',
    tags: ['Research method', 'Vision-language', 'Baselines'],
    naive:
      'Reproduce ViperGPT, extend its API, and measure only against the conditions that use a generated program.',
    whyItFails:
      'Without a baseline that skips program generation, you cannot tell whether the generated programs add anything. The comparison is between versions of the method, so a weak method still looks like progress.',
    approach:
      'Add B0: skip code generation and run find() on the full query. It outperformed every generated-program condition on both RefCOCO and RefCOCO+. The four-condition prompt study (C1 to C4) showed an API specification gap that did not shrink with model size, and the fifth condition (C5) helped some generators and slightly hurt another. So the value of the program-synthesis step is not yet established on these benchmarks. It is an uncomfortable result, and the most useful one in the repository.',
  },
]
