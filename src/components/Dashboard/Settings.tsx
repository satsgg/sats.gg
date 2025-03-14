import { z } from 'zod'
import { useZodForm } from '~/utils/useZodForm'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { trpc } from '~/utils/trpc'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { nip19 } from 'nostr-tools'
import ParticipantAvatar from '../ParticipantAvatar'

const MAX_HASHTAGS = 3
const MAX_PARTICIPANTS = 10

const SettingsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  image: z.string().min(1, 'Thumbnail URL is required').url('Must be a valid URL'),
  hashtags: z.array(z.string()).max(MAX_HASHTAGS, `Maximum ${MAX_HASHTAGS} hashtags allowed`),
  participants: z.array(z.string()).max(MAX_PARTICIPANTS, `Maximum ${MAX_PARTICIPANTS} participants allowed`),
})

type SettingsFormData = z.infer<typeof SettingsSchema>

export default function Settings({
  streamId,
  streamTitle,
  streamImage,
  streamHashtags,
  streamParticipants,
}: {
  streamId?: string
  streamTitle?: string | null
  streamImage?: string | null
  streamHashtags?: string[]
  streamParticipants?: string[]
}) {
  const [newHashtag, setNewHashtag] = useState('')
  const [newParticipant, setNewParticipant] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const utils = trpc.useContext()

  const streamSettingsMutation = trpc.stream.updateStreamSettings.useMutation({
    onSuccess: () => {
      console.debug('Stream settings updated')
      // Invalidate and refetch getCurrentStream query
      utils.stream.getCurrentStream.invalidate()
      toast({
        variant: 'default',
        title: 'Stream settings updated',
        description: 'Stream settings updated successfully.',
      })
      setIsSubmitting(false)
    },
    onError: (error) => {
      console.error('Error updating stream settings:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update stream settings. Please try again.',
      })
      setIsSubmitting(false)
    },
  })

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    reset,
    // formState: { errors, isSubmitting },
    formState: { errors },
  } = useZodForm({
    mode: 'onSubmit',
    schema: SettingsSchema,
    defaultValues: {
      title: streamTitle || '',
      image: streamImage || '',
      hashtags: streamHashtags || [],
      participants: streamParticipants || [],
    },
  })

  const currentHashtags = watch('hashtags') || []
  const currentParticipants = watch('participants') || []

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'image') {
        setThumbnailPreview(value.image || '')
      }
    })
    return () => subscription.unsubscribe()
  }, [watch])

  const addHashtag = () => {
    if (!newHashtag) return
    if (currentHashtags.length >= MAX_HASHTAGS) return
    // TODO: if npub, convert to hex
    setValue('hashtags', [...currentHashtags, newHashtag])
    setNewHashtag('')
  }

  const removeHashtag = (index: number) => {
    setValue(
      'hashtags',
      currentHashtags.filter((_, i) => i !== index),
    )
  }

  const addParticipant = () => {
    if (!newParticipant) return
    if (currentParticipants.length >= MAX_PARTICIPANTS) return

    let newParticipantHex = newParticipant
    if (newParticipant.startsWith('npub1')) {
      let { type, data: nipData } = nip19.decode(newParticipant)
      newParticipantHex = nipData as string
    }

    if (currentParticipants.includes(newParticipantHex)) {
      setError('participants', {
        type: 'unique',
        message: 'Participant already exists',
      })
      return
    }
    setValue('participants', [...currentParticipants, newParticipantHex])
    setNewParticipant('')
  }

  const removeParticipant = (index: number) => {
    setValue(
      'participants',
      currentParticipants.filter((_, i) => i !== index),
    )
  }

  const onSubmit = async (data: SettingsFormData) => {
    if (!streamId) return
    try {
      setIsSubmitting(true)
      console.log('Submitting settings:', data)
      // TODO: Add API call here
      // await mutateAsync(data)
      await streamSettingsMutation.mutateAsync({
        // TODO: get streamId from prop
        streamId: streamId,
        title: data.title,
        image: data.image,
        hashtags: data.hashtags,
        participants: data.participants,
      })
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  if (!streamId) {
    return <div>Create a stream to update settings!</div>
  }

  return (
    <div className="flex w-full flex-col space-y-6 px-6 pt-6">
      <h1 className="text-2xl font-bold">Stream Settings</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-4 ">
        <div>
          <Label htmlFor="title">Stream Title</Label>
          <Input id="title" {...register('title')} placeholder="Enter your stream title" autoComplete="off" />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="flex items-center space-x-4">
          <Avatar className="h-24 w-40 rounded-md">
            <AvatarImage src={thumbnailPreview} alt="Thumbnail" className="object-cover" />
            <AvatarFallback className="bg-accent/10 text-sm text-muted-foreground">Thumbnail</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Label htmlFor="image">Thumbnail URL</Label>
            <Input id="image" {...register('image')} placeholder="Enter thumbnail URL" autoComplete="off" />
            {errors.image && <p className="text-sm text-red-500">{errors.image.message}</p>}
          </div>
        </div>

        <div>
          <Label>
            Hashtags ({currentHashtags.length}/{MAX_HASHTAGS})
          </Label>
          <div className="flex gap-2">
            <Input
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              placeholder="Add a hashtag"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addHashtag()
                }
              }}
            />
            <Button
              type="button"
              onClick={addHashtag}
              disabled={currentHashtags.length >= MAX_HASHTAGS || !newHashtag}
              className="w-24 shrink-0"
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {currentHashtags.map((tag, index) => (
              <div key={index} className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm">
                {tag}
                <button
                  type="button"
                  onClick={() => removeHashtag(index)}
                  className="ml-1 rounded-full p-1 hover:bg-accent/50"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          {errors.hashtags && <p className="text-sm text-red-500">{errors.hashtags.message}</p>}
        </div>

        <div>
          <Label>
            Participants ({currentParticipants.length}/{MAX_PARTICIPANTS})
          </Label>
          <div className="flex gap-2">
            <Input
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              placeholder="Add a participant"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addParticipant()
                }
              }}
            />
            <Button
              type="button"
              onClick={addParticipant}
              disabled={currentParticipants.length >= MAX_PARTICIPANTS || !newParticipant}
              className="w-24 shrink-0"
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 px-2 pt-2">
            {currentParticipants.map((participant, index) => (
              // <div key={index} className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm">
              //   @{participant}
              //   <button
              //     type="button"
              //     onClick={() => removeParticipant(index)}
              //     className="ml-1 rounded-full p-1 hover:bg-accent/50"
              //   >
              //     <X className="h-3 w-3" />
              //   </button>
              // </div>
              // <ParticipantAvatar key={index} pubkey={participant} />
              <div key={index} className="group relative">
                <ParticipantAvatar pubkey={participant} size="h-10 w-10" />
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
            ))}
          </div>
          {errors.participants && <p className="text-sm text-red-500">{errors.participants.message}</p>}
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
