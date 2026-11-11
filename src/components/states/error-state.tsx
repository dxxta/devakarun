export function ErrorState({ title = 'Something went wrong', message = 'Please try again.' }: { title?: string; message?: string }) {
  return (
    <div className="rounded-card border-2 border-[#E5484D] bg-[#E5484D]/10 p-5 text-[#E5484D]" role="alert">
      <h2 className="m-0 font-display text-lg font-bold">{title}</h2>
      <p className="mb-0 mt-2 text-pretty">{message}</p>
    </div>
  )
}
