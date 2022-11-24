import Image from 'next/future/image'

export const ChatBadge = ({ src }) => {
  // TODO: This should be done here... ideally we would use badge ID in future instead of string
  // const getSrcImg = (badge: string) => {
  //   switch(badge) {
  //     // case 'nym': return '../../assets/nym2.png'
  //     case 'nym': return NymImg
  //     // case 'nym': return '/nym2.png'
  //     // case 'lnauth': return '../../assets/lnauth.png'
  //     // case 'lnauth': return '/lnauth.png'
  //     case 'lnauth': return LNAuthImg
  //   }
  // }
  return <Image src={src} alt="yo" className="inline-block pr-1 align-middle" height={20} width={20} />
}
