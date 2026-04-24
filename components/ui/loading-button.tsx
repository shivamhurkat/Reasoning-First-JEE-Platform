"use client"

import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

type ButtonProps = React.ComponentProps<typeof Button>

export function LoadingButton({
  loading,
  loadingText,
  children,
  ...props
}: ButtonProps & {
  loading: boolean
  loadingText?: string
}) {
  return (
    <Button {...props} disabled={props.disabled || loading}>
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
