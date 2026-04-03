import React from 'react'

// Lightweight stub: renders a plain <img> with the same props
const NextImage = ({
  src,
  alt,
  fill: _fill,
  sizes: _sizes,
  priority: _priority,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean
  sizes?: string
  priority?: boolean
}) => <img src={src as string} alt={alt} {...rest} />

NextImage.displayName = 'NextImage'
export default NextImage
