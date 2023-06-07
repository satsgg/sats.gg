import type { NextApiRequest, NextApiResponse } from 'next'

const verifiedDB = {
  chad: {
    pubkey: 'npub1aypcuyy3dkgss6wmvmeung05z56evucgk37wxymvnrc6dg32v9gqez0hdf',
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  let nip05 = {
    names: {},
    relays: {},
  }

  if (typeof req.query.name == 'string') {
    const pubkey = verifiedDB[req.query.name]?.pubkey
    if (!pubkey) return res.status(200).json(nip05)

    nip05.names[req.query.name] = pubkey

    const relays = verifiedDB[req.query.name].relays
    if (relays && relays.length > 0) {
      nip05.relays[pubkey] = verifiedDB[req.query.name].relays
    }
  }

  res.status(200).json(nip05)
}
