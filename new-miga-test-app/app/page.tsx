import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1>New Project Image Test</h1>
      <p>Below should be a test image from a new project:</p>
      <Image
        src="/local_test_image.png" // Use local image
        alt="New Project Test Image"
        width={200}
        height={200}
        style={{ border: '3px solid green' }}
      />
      <p>If you see this image, Next.js image rendering works in this new project.</p>
    </main>
  );
}
