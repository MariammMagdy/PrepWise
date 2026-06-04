import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/layout/Navbar';
import { User, Save, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiUrl } from '../src/frontend/utils/api';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    jobTitle: '',
    company: '',
    experience: 'junior',
    skills: '',
    difficulty: 'adaptive',
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    fetchProfile(token);
  }, [router]);

  const fetchProfile = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl('/api/auth/me'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const u = data.user;
        // Always update localStorage with fresh server data
        localStorage.setItem('user', JSON.stringify(u));
        setUser(u);
        setFormData({
          name: u.name || '',
          email: u.email || '',
          jobTitle: u.profile?.jobTitle || '',
          company: u.profile?.company || '',
          experience: u.profile?.experience || 'junior',
          skills: Array.isArray(u.profile?.skills) 
            ? u.profile.skills.join(', ') 
            : (u.profile?.skills || ''),
          difficulty: u.preferences?.difficulty || 'adaptive',
        });
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /*const fetchProfile = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl('/api/auth/me'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const u = data.user;
        setUser(u);
        setFormData({
          name: u.name || '',
          email: u.email || '',
          jobTitle: u.profile?.jobTitle || '',
          company: u.profile?.company || '',
          experience: u.profile?.experience || 'junior',
          skills: u.profile?.skills?.join(', ') || '',
          difficulty: u.preferences?.difficulty || 'adaptive',
        });
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };*/

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/user/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          profile: {
            jobTitle: formData.jobTitle,
            company: formData.company,
            experience: formData.experience,
            skills: formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
          },
          preferences: {
            difficulty: formData.difficulty,
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        // Build complete updated user object
        const updatedUser = {
          ...data.user,
          profile: {
            ...(data.user.profile || {}),
            jobTitle: formData.jobTitle,
            company: formData.company,
            experience: formData.experience,
            skills: formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
          },
          preferences: {
            difficulty: formData.difficulty,
          }
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        // Re-fetch from server to confirm saved correctly
        await fetchProfile(token!);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /*const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/user/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          profile: {
            jobTitle: formData.jobTitle,
            company: formData.company,
            experience: formData.experience,
            skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
          },
          preferences: {
            difficulty: formData.difficulty,
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        /*localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        toast.success('Profile updated successfully!');*/
        // Make sure the full user object is saved to localStorage
        /*const updatedUser = {
          ...data.user,
          profile: {
            ...data.user.profile,
            jobTitle: formData.jobTitle,
            company: formData.company,
            experience: formData.experience,
            skills: formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
          }
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };*/

  if (!user && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={null} />
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-primary-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Update your personal information and interview preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">

          {/* Avatar */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{formData.name}</p>
              <p className="text-sm text-gray-500">{formData.email}</p>
            </div>
          </div>

          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                  placeholder="e.g. Frontend Developer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g. Google"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Experience */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience & Skills</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="junior">Junior (0-2 years)</option>
                  <option value="mid">Mid (2-5 years)</option>
                  <option value="senior">Senior (5+ years)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills <span className="text-gray-400 font-normal">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="e.g. React, Node.js, TypeScript"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Preferences</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="adaptive">Adaptive (recommended)</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;