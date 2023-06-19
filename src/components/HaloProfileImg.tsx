import ProfileImg from './ProfileImg'

const HaloProfileImg = ({
  pubkey,
  picture,
  liveBorder = false,
}: {
  pubkey: string
  picture: string | undefined
  liveBorder?: boolean
}) => {
  return (
    <a
      href={`https://nostr.com/p/${pubkey}`}
      target="_blank"
      // NOTE: Outline to prevent profile img from shrinking on hover?
      className={`
        ${liveBorder ? 'border-primary' : 'border-gray-500'}
        block h-full w-full rounded-[50%] border-2 p-0.5 hover:border-[3px]
      `}
    >
      <ProfileImg pubkey={pubkey} picture={picture} />
    </a>
  )
}

export default HaloProfileImg
