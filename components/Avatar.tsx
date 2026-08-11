import Image from "next/image";

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}

export function Avatar({ username, avatarUrl, size = 36 }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={username}
        width={size}
        height={size}
        className="rounded object-cover"
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded bg-wood text-off-white font-body text-xs font-semibold"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}
