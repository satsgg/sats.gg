export const streamPubkey = 'e9038e10916d910869db66f3c9a1f41535967308b47ce3136c98f1a6a22a6150'
export const streamIdentifier = 'atlbitlabhalloweenparty2023'
export const zapInfo = {
  callback: 'https://livingroomofsatoshi.com/api/v1/lnurl/payreq/7d8309aa-c2c5-4716-b360-601ef02c8c84',
  minSendable: 1000,
  maxSendable: 100000000000,
  nostrPubkey: 'be1d89794bf92de5dd64c1e60f6a2c70c140abac9932418fee30c5c637fe9479',
  lnurl: 'https://walletofsatoshi.com/.well-known/lnurlp/babyhot10',
}

export const queryVideo = async (id: string) => {
  const cleanedVideoUrl = 'https://www.youtube.com/watch?v=' + id
  const oembedUrl = 'https://www.youtube.com/oembed?url='
  const query = oembedUrl + encodeURIComponent(cleanedVideoUrl + '&format=json')

  const res = await fetch(query)
  if (res.ok) {
    const resJson = await res.json()
    console.debug('resJson', resJson)
    return {
      title: resJson.title,
      author: resJson.author_name,
      thumbnail: resJson.thumbnail_url,
    }
  }

  return null
}

const VIDEO_ID_REGEX = /(watch\?v=)?([\w\-\d]{11})/
export const parseVideoId = (content: string): string | null => {
  if (content === '') return null

  const parsedUrl = VIDEO_ID_REGEX.exec(content)
  if (!parsedUrl || !parsedUrl[2]) return null

  return parsedUrl[2]
}
