import { requireAppUser } from "@/lib/auth";
import { getGameForViewer } from "@/lib/games";

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireAppUser();
    const { code } = await params;

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let intervalId: NodeJS.Timeout | null = null;
        let lastUpdate = "";

        async function sendGame() {
          const game = await getGameForViewer(code, user.clerkId);
          if (!game) {
            controller.close();
            return;
          }

          const update = JSON.stringify({ game });
          if (update !== lastUpdate) {
            lastUpdate = update;
            controller.enqueue(encoder.encode(`data: ${update}\n\n`));
          }
        }

        sendGame();

        intervalId = setInterval(async () => {
          try {
            await sendGame();
          } catch {
            if (intervalId) clearInterval(intervalId);
            controller.close();
          }
        }, 1000);

        return () => {
          if (intervalId) clearInterval(intervalId);
        };
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      }
    });
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
}
