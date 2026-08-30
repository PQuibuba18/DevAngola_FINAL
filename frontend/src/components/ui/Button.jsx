
export default function Button({ children, variant='primary', size='md', full=false, loading=false, as:Tag='button', className='', ...props }) {
  const cls = ['btn', `btn--${variant}`, `btn--${size}`, full?'btn--full':'', loading?'btn--loading':'', className].filter(Boolean).join(' ');
  return <Tag className={cls} disabled={loading||props.disabled} {...props}>{children}</Tag>;
}
