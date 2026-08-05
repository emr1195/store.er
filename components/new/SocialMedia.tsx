import { Facebook, Instagram, Youtube } from "lucide-react";

const networks = [{ title: "YouTube", icon: Youtube }, { title: "Facebook", icon: Facebook }, { title: "Instagram", icon: Instagram }];

export default function SocialMedia() {
  return <div className="flex items-center gap-2">{networks.map(({ title, icon: Icon }) => <span key={title} role="img" aria-label={`${title}: enlace pendiente de confirmar`} title="Enlace pendiente de confirmar" className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full border border-white/25 text-white/55"><Icon aria-hidden="true" className="h-5 w-5" /></span>)}</div>;
}
