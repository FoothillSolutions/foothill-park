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
 * Body: { discordUsername: string; ownerName: string }
 *
 * Looks up the user in the company Guild by username, opens a DM channel,
 * and sends a parking-block notification on behalf of the caller.
 */
router.post('/dm', authenticate, requirePlate, async (req: Request, res: Response) => {
  const { discordUsername, ownerName } = req.body as {
    discordUsername: string;
    ownerName: string;
  };

  if (!discordUsername || !ownerName) {
    res.status(400).json({ error: 'discordUsername and ownerName are required' });
    return;
  }

  const guildId   = process.env.DISCORD_GUILD_ID;
  const botToken  = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !botToken) {
    res.status(503).json({ error: 'Discord integration is not configured on the server.' });
    return;
  }

  try {
    // Strip legacy discriminator suffix (e.g. "sarawan#3094" → "sarawan")
    const searchQuery = discordUsername.replace(/#\d{4}$/, '').trim();

    // 1. Search guild members by the stored username
    const members: any[] = await discordFetch(
      `/guilds/${guildId}/members/search?query=${encodeURIComponent(searchQuery)}&limit=10`
    );

    if (!members || members.length === 0) {
      res.status(404).json({ error: `No Discord member found matching "${discordUsername}"` });
      return;
    }

    // Prefer exact username match (compare without discriminator); fall back to first result
    const queryLower = searchQuery.toLowerCase();
    const member =
      members.find(
        (m) =>
          m.user?.username?.toLowerCase() === queryLower ||
          m.user?.global_name?.toLowerCase() === queryLower ||
          m.nick?.toLowerCase() === queryLower
      ) ?? members[0];

    const userId = member?.user?.id;
    if (!userId) {
      res.status(404).json({ error: 'Could not resolve Discord user ID.' });
      return;
    }

    // 2. Open (or reuse) a DM channel with that user
    const dmChannel = await discordFetch('/users/@me/channels', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: userId }),
    });

    // 3. Send the notification message
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
