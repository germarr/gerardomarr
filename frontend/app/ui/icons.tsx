import type { Handle } from 'remix/ui'

export interface IconProps {
  size?: number
}

export function ArrowOut(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 13}
      height={handle.props.size ?? 13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7"></path>
      <path d="M8 7h9v9"></path>
    </svg>
  )
}

export function ArrowRight(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 13}
      height={handle.props.size ?? 13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h13"></path>
      <path d="M13 6l6 6-6 6"></path>
    </svg>
  )
}

export function ArrowBack(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 13}
      height={handle.props.size ?? 13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H6"></path>
      <path d="M11 6l-6 6 6 6"></path>
    </svg>
  )
}

export function Moon(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 12}
      height={handle.props.size ?? 12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"></path>
    </svg>
  )
}

export function GitHub(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 15}
      height={handle.props.size ?? 15}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 1.8a10.2 10.2 0 0 0-3.2 19.9c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.6.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.4 4.7-4.6 4.9.3.3.7 1 .7 2v3c0 .3.2.6.7.5A10.2 10.2 0 0 0 12 1.8Z"></path>
    </svg>
  )
}

export function LinkedIn(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 15}
      height={handle.props.size ?? 15}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4v11H3v-11Zm6.5 0h3.8v1.5h.06a4.2 4.2 0 0 1 3.78-2c4 0 4.76 2.6 4.76 6v5.5h-4v-4.9c0-1.2 0-2.7-1.7-2.7s-1.96 1.3-1.96 2.6v5h-4v-11Z"></path>
    </svg>
  )
}

export function Instagram(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 15}
      height={handle.props.size ?? 15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5"></rect>
      <circle cx="12" cy="12" r="4"></circle>
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"></circle>
    </svg>
  )
}
