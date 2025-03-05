import { z } from 'zod'
import { useZodForm } from '~/utils/useZodForm'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { trpc } from '~/utils/trpc'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'

const MAX_HASHTAGS = 3
const MAX_PARTICIPANTS = 10

const SettingsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  image: z.string().min(1, 'Thumbnail URL is required').url('Must be a valid URL'),
  hashtags: z.array(z.string()).max(MAX_HASHTAGS, `Maximum ${MAX_HASHTAGS} hashtags allowed`),
  participants: z.array(z.string()).max(MAX_PARTICIPANTS, `Maximum ${MAX_PARTICIPANTS} participants allowed`),
})

type SettingsFormData = z.infer<typeof SettingsSchema>

export default function Settings() {
  const [newHashtag, setNewHashtag] = useState('')
  const [newParticipant, setNewParticipant] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useZodForm({
    mode: 'onSubmit',
    schema: SettingsSchema,
    defaultValues: {
      title: '',
      image: '',
      hashtags: [],
      participants: [],
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
    setValue('participants', [...currentParticipants, newParticipant])
    setNewParticipant('')
  }

  const removeParticipant = (index: number) => {
    setValue(
      'participants',
      currentParticipants.filter((_, i) => i !== index),
    )
  }

  const onSubmit = async (data: SettingsFormData) => {
    try {
      console.log('Submitting settings:', data)
      // TODO: Add API call here
      // await mutateAsync(data)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  return (
    <div className="flex w-full flex-col px-8 pt-8">
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
                #{tag}
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
          <div className="flex flex-wrap gap-2 pt-2">
            {currentParticipants.map((participant, index) => (
              <div key={index} className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm">
                @{participant}
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="ml-1 rounded-full p-1 hover:bg-accent/50"
                >
                  <X className="h-3 w-3" />
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
