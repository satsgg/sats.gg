import { parseStreamNote } from './nostr'

const note = {
  content: '',
  created_at: 1697212955,
  id: 'id1',
  kind: 30311,
  pubkey: 'pubkey1',
  sig: 'sig1',
  tags: [
    ['d', 'd1'],
    ['title', 'title1'],
    ['summary', 'summary1'],
    ['image', 'image1'],
    ['streaming', 'streaming1'],
    ['status', 'live'],
    ['starts', 'starts1'],
    ['t', 't1'],
    ['t', 't2'],
    ['goal', 'goal1'],
    ['p', '91cf9..4e5ca', 'wss://provider1.com/', 'Host', '<proof>'],
    ['p', '14aeb..8dad4', 'wss://provider2.com/nostr', 'Speaker'],
    ['p', '612ae..e610f', 'ws://provider3.com/ws', 'Participant'],
    ['relays', 'wss://one.com', 'wss://two.com'],
  ],
}

test('parseStreamNote works', () => {
  const parsedStreamNote = parseStreamNote(note)
  console.log('parsedStreamNote', parsedStreamNote)
  expect(1).toBe(1)
})
