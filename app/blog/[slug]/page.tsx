import { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  
  return {
    title: `${title} | Blog`,
    alternates: {
      canonical: `https://craudiovizai.com/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const title = slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/blog" className="text-cyan-400 hover:text-cyan-300 mb-4 inline-block">
          Back to Blog
        </Link>
        
        <article className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
          <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>
          <p className="text-slate-400 mb-8">Coming Soon</p>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300">
              This blog post is currently being written. Check back soon for insights.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}

