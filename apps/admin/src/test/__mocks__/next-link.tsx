import React from 'react'

// Stub: renders a plain <a> so href assertions work
const NextLink = ({
  href,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
  <a href={href} {...rest}>
    {children}
  </a>
)

NextLink.displayName = 'NextLink'
export default NextLink
