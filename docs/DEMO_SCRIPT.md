# 90-Second Demo Script

Hello everyone, this is MemGateQA. Most agent memory demos show what an agent remembers, but we ask a harder question: can we trust what it remembers?

Here I have a WolfPack Tasks memory incident. The agent has old project notes saying we use Supabase and demo at 5 PM, but the final decision says Supabase was rejected, the stack is Next.js, Postgres, pgvector, and Cognee Cloud, and the demo moved to 2 PM. There are also private notes and a forget request.

I start the Evidence Factory. Approved evidence is sent into Cognee memory through remember. Then I run the Interrogation Room, which asks trap questions against recall. The agent fails: it remembers the old Supabase plan, gives the wrong demo time, follows a false premise, leaks a private token, and still recalls data that should be forgotten.

Now the Suspect Wall turns those bad memories into clear bugs. Each issue shows the expected answer, the actual recall, the evidence that caused it, and the recommended Cognee operation.

Before fixing anything, MemGateQA requires human approval. In Memory Surgery, I approve improve for stale decisions, remember for the safety policy, and forget for private or deleted data. Then we rerun the exact same tests.

Now the final report proves the memory is safer: stale decisions are corrected, private data is blocked, forgotten data is not retrievable, and the Memory Health Score improves. Cognee gives the agent long-term memory. MemGateQA makes that memory testable, repairable, and production-ready.
