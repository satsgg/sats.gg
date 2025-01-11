import { useState } from 'react'
import getSettingsLayout from '~/components/Settings/Layout'
import { trpc } from '~/utils/trpc'
import useAuthStore from '~/hooks/useAuthStore'
import { Spinner } from '~/components/Spinner'
import { User } from '@prisma/client'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import { toast } from 'react-toastify'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

const MAX_SATS = 100_000_000_000 // 100 billion satoshis (1000 BTC)

const formSchema = z.object({
  defaultZapAmount: z
    .number()
    .int()
    .min(1, { message: 'Minimum zap amount is 1 satoshi' })
    .max(MAX_SATS, { message: `Maximum zap amount is ${MAX_SATS.toLocaleString()} satoshis` }),
})

const Zaps = ({ user, setUser }: { user: User; setUser: (user: User) => void }) => {
  const utils = trpc.useContext()
  const setDefaultZapAmountMutation = trpc.user.setDefaultZapAmount.useMutation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useZodForm({
    mode: 'onSubmit',
    schema: formSchema,
    defaultValues: {
      defaultZapAmount: user.defaultZapAmount,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      setUser(await setDefaultZapAmountMutation.mutateAsync({ defaultZapAmount: values.defaultZapAmount }))
      await utils.invalidate()
      toast.success('Updated default zap amount!', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    } catch (err: any) {
      console.error(err.message)
      toast.error(err.message, {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Zap Settings</CardTitle>
        <CardDescription>Configure your default zap amount for nostr payments</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="defaultZapAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Zap Amount (satoshis)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormDescription>Set your default zap amount in satoshis. 1 satoshi = 0.00000001 BTC</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default function ZapsSettingsWrapper({}) {
  const [user, setUser, view] = useAuthStore((state) => [state.user, state.setUser, state.view])

  if (view && view !== 'authenticated') {
    return <p>You must be logged in to view this page</p>
  }

  if (user) {
    return <Zaps user={user} setUser={setUser} />
  }

  return (
    <div className={'w-full text-center'}>
      <Spinner />
    </div>
  )
}

ZapsSettingsWrapper.getLayout = getSettingsLayout
