import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requirePlate } from '../middleware/requirePlate';

const router = Router();

const DISCORD_API = 'https://discord.com/api/v10';

async function discordFetch(path: string, options: RequestInit = {}): Promise<any> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord API error (${res.status}): ${body}`);
  }
  return res.json();
}

/**
 * POST /api/discord/dm
 * Body: { discordId: string; ownerName: string }
 *
 * Opens a DM channel directly using the stored numeric Discord user ID
 * and sends a parking-block notification on behalf of the caller.
 *
 * The bot must share a guild with the recipient for Discord to allow the DM.
 */
router.post('/dm', authenticate, requirePlate, async (req: Request, res: Response) => {
  const { discordId, ownerName } = req.body as {
    discordId: string;
    ownerName: string;
  };

  if (!discordId || !ownerName) {
    res.status(400).json({ error: 'discordId and ownerName are required' });
    return;
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    res.status(503).json({ error: 'Discord integration is not configured on the server.' });
    return;
  }

  // Validate that discordId is a numeric snowflake
  if (!/^\d+$/.test(discordId)) {
    res.status(400).json({ error: 'discordId must be a numeric Discord snowflake.' });
    return;
  }

  try {
    // 1. Open (or reuse) a DM channel directly with the stored numeric user ID.
    //    No guild search needed — we already have the real Discord user ID.
    const dmChannel = await discordFetch('/users/@me/channels', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: discordId }),
    });

    // 2. Send the notification message
    const senderName = req.user?.displayName ?? 'A colleague';
    const message =
      `👋 Hi **${ownerName}**!\n\n` +
      `Your car is blocking someone in the **Foothill Solutions** parking lot. ` +
      `Could you please move it when you get a chance? 🚗\n\n` +
      `— ${senderName} (via Foothill Park App)`;

    await discordFetch(`/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: message }),
    });

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[Discord DM]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
