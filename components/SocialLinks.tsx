// /components/SocialLinks.tsx
// Comprehensive Social Media Links - CR AudioViz AI / Javari
// ALL platforms, follow CTAs, member-driven additions

'use client';

import React from 'react';
import { motion } from 'framer-motion';

// =============================================================================
// ALL SOCIAL PLATFORMS
// =============================================================================

export interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  url: string;
  color: string;
  hoverColor: string;
  followers?: string;
  username?: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    url: 'https://twitter.com/CRAudioVizAI',
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-800',
    username: '@CRAudioVizAI'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    url: 'https://facebook.com/CRAudioVizAI',
    color: 'bg-[#1877F2]',
    hoverColor: 'hover:bg-[#166FE5]',
    username: 'CRAudioVizAI'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    url: 'https://instagram.com/CRAudioVizAI',
    color: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]',
    hoverColor: 'hover:opacity-90',
    username: '@CRAudioVizAI'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    url: 'https://linkedin.com/company/craudiovizai',
    color: 'bg-[#0A66C2]',
    hoverColor: 'hover:bg-[#004182]',
    username: 'CR AudioViz AI'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    url: 'https://youtube.com/@CRAudioVizAI',
    color: 'bg-[#FF0000]',
    hoverColor: 'hover:bg-[#CC0000]',
    username: '@CRAudioVizAI'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
    url: 'https://tiktok.com/@CRAudioVizAI',
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-800',
    username: '@CRAudioVizAI'
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
      </svg>
    ),
    url: 'https://discord.gg/javari',
    color: 'bg-[#5865F2]',
    hoverColor: 'hover:bg-[#4752C4]',
    username: 'Javari Community'
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.88-.73 2.108-1.146 3.456-1.17 1.005-.018 1.92.112 2.755.39-.07-.54-.208-.995-.418-1.37-.372-.665-1.002-1.009-1.87-1.023-1.857.026-2.721.673-3.373 1.36l-1.353-1.541c.959-1.012 2.381-1.921 4.748-1.936h.038c1.493.015 2.678.511 3.523 1.477.756.864 1.212 2.048 1.359 3.521.464.168.889.378 1.273.631 1.063.697 1.873 1.678 2.35 2.848.67 1.64.74 4.453-1.535 6.682-1.887 1.85-4.234 2.676-7.385 2.696zm.186-7.358c-.106 0-.214.003-.323.01-.947.052-1.694.334-2.161.816-.39.402-.567.903-.527 1.49.034.584.335 1.09.848 1.424.546.353 1.282.53 2.131.51 1.016-.056 1.78-.436 2.334-1.163.388-.508.676-1.2.858-2.055-.353-.097-.727-.168-1.118-.211a8.89 8.89 0 00-1.042-.061v-.76z"/>
      </svg>
    ),
    url: 'https://threads.net/@CRAudioVizAI',
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-800',
    username: '@CRAudioVizAI'
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
      </svg>
    ),
    url: 'https://pinterest.com/CRAudioVizAI',
    color: 'bg-[#E60023]',
    hoverColor: 'hover:bg-[#AD081B]',
    username: 'CRAudioVizAI'
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
      </svg>
    ),
    url: 'https://reddit.com/r/CRAudioVizAI',
    color: 'bg-[#FF4500]',
    hoverColor: 'hover:bg-[#CC3700]',
    username: 'r/CRAudioVizAI'
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
      </svg>
    ),
    url: 'https://twitch.tv/CRAudioVizAI',
    color: 'bg-[#9146FF]',
    hoverColor: 'hover:bg-[#772CE8]',
    username: 'CRAudioVizAI'
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
      </svg>
    ),
    url: 'https://snapchat.com/add/CRAudioVizAI',
    color: 'bg-[#FFFC00]',
    hoverColor: 'hover:bg-[#E6E300]',
    username: 'CRAudioVizAI'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    url: 'https://t.me/CRAudioVizAI',
    color: 'bg-[#0088CC]',
    hoverColor: 'hover:bg-[#006699]',
    username: '@CRAudioVizAI'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    ),
    url: 'https://wa.me/message/CRAudioVizAI',
    color: 'bg-[#25D366]',
    hoverColor: 'hover:bg-[#128C7E]',
    username: 'CR AudioViz AI'
  }
];

// =============================================================================
// SOCIAL LINKS COMPONENTS
// =============================================================================

interface SocialLinksProps {
  variant?: 'icons' | 'buttons' | 'list' | 'grid';
  showLabels?: boolean;
  platforms?: string[]; // Filter to specific platforms
  className?: string;
}

export function SocialLinks({ 
  variant = 'icons', 
  showLabels = false,
  platforms,
  className = ''
}: SocialLinksProps) {
  const filteredPlatforms = platforms 
    ? SOCIAL_PLATFORMS.filter(p => platforms.includes(p.id))
    : SOCIAL_PLATFORMS;

  if (variant === 'icons') {
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {filteredPlatforms.map((platform) => (
          <motion.a
            key={platform.id}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`w-10 h-10 ${platform.color} ${platform.hoverColor} text-white rounded-lg flex items-center justify-center transition-colors`}
            title={`Follow us on ${platform.name}`}
          >
            {platform.icon}
          </motion.a>
        ))}
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {filteredPlatforms.map((platform) => (
          <motion.a
            key={platform.id}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-4 py-2 ${platform.color} ${platform.hoverColor} text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium`}
          >
            {platform.icon}
            <span>Follow on {platform.name}</span>
          </motion.a>
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
        {filteredPlatforms.map((platform) => (
          <motion.a
            key={platform.id}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`${platform.color} ${platform.hoverColor} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-all shadow-lg`}
          >
            <span className="text-2xl">{platform.icon}</span>
            <span className="font-medium text-sm">{platform.name}</span>
            {platform.username && (
              <span className="text-xs opacity-80">{platform.username}</span>
            )}
          </motion.a>
        ))}
      </div>
    );
  }

  // List variant
  return (
    <div className={`space-y-2 ${className}`}>
      {filteredPlatforms.map((platform) => (
        <a
          key={platform.id}
          href={platform.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className={`w-10 h-10 ${platform.color} text-white rounded-lg flex items-center justify-center`}>
            {platform.icon}
          </span>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{platform.name}</p>
            {platform.username && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{platform.username}</p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

// =============================================================================
// FOLLOW CTA SECTION
// =============================================================================

export function FollowCTA({ className = '' }: { className?: string }) {
  return (
    <section className={`bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Join Our Community! 🎉</h2>
        <p className="text-blue-100 max-w-xl mx-auto">
          Follow us everywhere for updates, tips, tutorials, and exclusive content. 
          We're building something amazing together!
        </p>
      </div>
      
      <SocialLinks variant="grid" className="max-w-4xl mx-auto" />
      
      <div className="text-center mt-8">
        <p className="text-sm text-blue-200">
          On a platform we're not on? <a href="/contact?subject=social" className="underline hover:text-white">Let us know</a> and we'll join!
        </p>
      </div>
    </section>
  );
}

// =============================================================================
// FOOTER SOCIAL SECTION
// =============================================================================

export function FooterSocials() {
  const primaryPlatforms = ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'tiktok', 'discord'];
  
  return (
    <div>
      <h4 className="font-semibold text-white mb-4">Follow Us</h4>
      <SocialLinks 
        variant="icons" 
        platforms={primaryPlatforms}
        className="mb-4"
      />
      <a 
        href="/socials" 
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        See all platforms →
      </a>
    </div>
  );
}

// =============================================================================
// SUGGEST PLATFORM COMPONENT
// =============================================================================

export function SuggestPlatform() {
  const [platform, setPlatform] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform.trim()) return;

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'platform_suggestion',
          content: platform,
          timestamp: new Date().toISOString()
        })
      });
      setSubmitted(true);
      setPlatform('');
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg text-center">
        <p className="text-green-600 dark:text-green-400 font-medium">
          Thanks! We'll look into joining that platform! 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
        Missing Your Favorite Platform?
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Tell us where you'd like to find us and we'll join!
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          placeholder="Platform name..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
        />
        <button
          type="submit"
          disabled={!platform.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Suggest
        </button>
      </form>
    </div>
  );
}

export default SocialLinks;
