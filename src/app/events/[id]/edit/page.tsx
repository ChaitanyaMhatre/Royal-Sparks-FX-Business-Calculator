import { redirect } from 'next/navigation';

export default function EventEditRedirect({ params }: { params: { id: string } }) {
  redirect(`/calculation?id=${params.id}`);
}
