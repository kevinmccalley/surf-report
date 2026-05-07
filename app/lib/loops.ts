const LOOPS_API = 'https://app.loops.so/api/v1'

type PropValue = string | number | boolean | undefined

interface ContactProps {
  firstName?: string
  lastName?: string
  subscriptionStatus?: string
  swellAlertOptIn?: boolean
  [key: string]: PropValue
}

async function post(path: string, body: unknown): Promise<void> {
  const key = process.env.LOOPS_API_KEY
  if (!key) return
  try {
    await fetch(`${LOOPS_API}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // non-critical — never let email errors break the main flow
  }
}

async function put(path: string, body: unknown): Promise<void> {
  const key = process.env.LOOPS_API_KEY
  if (!key) return
  try {
    await fetch(`${LOOPS_API}${path}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // non-critical
  }
}

export async function syncContact(
  email: string,
  userId: string,
  props: ContactProps = {},
): Promise<void> {
  await put('/contacts/update', { email, userId, ...props })
}

export async function triggerEvent(
  email: string,
  eventName: string,
  eventProperties: Record<string, string | number | boolean> = {},
): Promise<void> {
  await post('/events/send', { email, eventName, eventProperties })
}
