'use client';

import { ProfileForm } from '@/components/user/ProfileForm';

export default function WholesalerProfilePage() {
  return (
    <div className="flex flex-col space-y-6 py-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">প্রোফাইল ইনফরমেশন (Profile Information)</h1>
          <p className="text-sm text-muted-foreground mt-1">আপনার ব্যক্তিগত তথ্য এবং ঠিকানা আপডেট করুন।</p>
        </div>
      </div>
      <ProfileForm />
    </div>
  );
}
