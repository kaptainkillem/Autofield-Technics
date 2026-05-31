export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 md:py-0 md:px-0 bg-grey-lightest">
      {children}
    </div>
  );
}