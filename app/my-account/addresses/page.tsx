'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/Button';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import Script from 'next/script'; // Import the Script component

// Define window interface for daum postcode service
declare global {
  interface Window {
    daum: any;
  }
}

interface Address {
  id: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string | null;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '대한민국',
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users/addresses');
      if (!res.ok) {
        throw new Error('Failed to fetch addresses');
      }
      const data: Address[] = await res.json();
      setAddresses(data);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      if (err instanceof Error) {
        setError(err.message || '주소록을 불러오는 데 실패했습니다.');
      } else {
        setError('주소록을 불러오는 데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddressSearch = () => {
    if (typeof window.daum === 'undefined') {
      alert('주소 검색 서비스가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data: any) {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname;
          }
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          fullAddress += (extraAddress !== '' ? ' (' + extraAddress + ')' : '');
        }

        setFormData(prev => ({
          ...prev,
          zipCode: data.zonecode,
          address1: fullAddress,
          city: data.sido, 
          state: data.sigungu,
          address2: '', // Clear address2 for user to input details
        }));
      }
    }).open();
  };

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const method = editingAddress ? 'PUT' : 'POST';
    const url = editingAddress ? `/api/users/addresses/${editingAddress.id}` : '/api/users/addresses';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`주소가 성공적으로 ${editingAddress ? '수정' : '추가'}되었습니다!`);
        setShowForm(false);
        setEditingAddress(null);
        setFormData({
          address1: '', address2: '', city: '', state: '', zipCode: '', country: '대한민국', isDefault: false,
        });
        fetchAddresses(); // Refresh the list
      } else {
        setError(data.message || `주소 ${editingAddress ? '수정' : '추가'}에 실패했습니다.`);
      }
    } catch (err) {
      console.error(`Error ${editingAddress ? 'updating' : 'adding'} address:`, err);
      if (err instanceof Error) {
        setError(err.message || `주소 ${editingAddress ? '수정' : '추가'} 중 오류가 발생했습니다.`);
      } else {
        setError(`주소 ${editingAddress ? '수정' : '추가'} 중 오류가 발생했습니다.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: address.state || '',
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (addressId: string) => {
    if (!confirm('정말로 이 주소를 삭제하시겠습니까?')) {
      return;
    }
    // ... (rest of the function is the same)
  };

  const handleSetDefaultClick = async (addressId: string) => {
    // ... (rest of the function is the same)
  };

  if (loading) {
    return <div className="container mx-auto p-8 text-center">주소록을 불러오는 중...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      <h1 className="text-3xl font-bold mb-8">주소록 관리</h1>
      <Button
        onClick={() => { setShowForm(true); setEditingAddress(null); setFormData({ address1: '', address2: '', city: '', state: '', zipCode: '', country: '대한민국', isDefault: false }); }}
        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 inline-flex items-center space-x-2 mb-6"
      >
        <Plus className="h-5 w-5" />
        <span>새 주소 추가</span>
      </Button>
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4 mb-8">
          <h2 className="text-xl font-semibold">{editingAddress ? '주소 수정' : '새 주소 추가'}</h2>
          <form onSubmit={handleAddEditSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">우편번호</label>
                    <input type="text" id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" required readOnly />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">&nbsp;</label>
                    <Button type="button" onClick={handleAddressSearch} className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                        우편번호 찾기
                    </Button>
                </div>
            </div>
            <div>
              <label htmlFor="address1" className="block text-sm font-medium text-gray-700">주소</label>
              <input type="text" id="address1" name="address1" value={formData.address1} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" required readOnly />
            </div>
            <div>
              <label htmlFor="address2" className="block text-sm font-medium text-gray-700">상세주소</label>
              <input type="text" id="address2" name="address2" value={formData.address2} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="아파트 동/호수 등 상세주소를 입력하세요" required />
            </div>
            {/* Hidden city and state fields for data storage */}
            <input type="hidden" name="city" value={formData.city} />
            <input type="hidden" name="state" value={formData.state} />

            <div className="flex items-center">
              <input type="checkbox" id="isDefault" name="isDefault" checked={formData.isDefault} onChange={handleFormChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
              <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">기본 주소로 설정</label>
            </div>
            <div className="flex space-x-4">
              <Button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700" disabled={submitting}>
                {submitting ? '저장 중...' : '저장'}
              </Button>
              <Button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">
                취소
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {message && <p className="text-green-500 text-sm mt-2">{message}</p>}
          </form>
        </div>
      )}
      {/* Address List Rendering (same as before) */}
      {addresses.length === 0 && !showForm ? (
        <div className="text-center text-gray-600">
          <p>아직 등록된 주소가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div key={address.id} className={`bg-white p-6 rounded-lg shadow-md border ${address.isDefault ? 'border-blue-500' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">{address.address1} {address.address2}</p>
                  <p className="text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                  <p className="text-gray-600">{address.country}</p>
                  {address.isDefault && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                      <CheckCircle className="h-3 w-3 mr-1" /> 기본 주소
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => handleEditClick(address)} className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 text-sm inline-flex items-center space-x-1">
                    <Edit className="h-4 w-4" />
                    <span>수정</span>
                  </Button>
                  {!address.isDefault && ( // Cannot delete default address directly
                    (<Button onClick={() => handleDeleteClick(address.id)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm inline-flex items-center space-x-1">
                      <Trash2 className="h-4 w-4" />
                      <span>삭제</span>
                    </Button>)
                  )}
                  {!address.isDefault && (
                    <Button onClick={() => handleSetDefaultClick(address.id)} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300 text-sm">
                      기본 설정
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}