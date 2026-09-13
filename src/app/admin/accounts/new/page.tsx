'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import { AddEmployeeModal } from '@/components/employees/AddEmployeeModal';

export default function NewAccountPage() {
  const router = useRouter();
  const { state, addEmployee } = useEmsStore();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const departmentNames = state.departments.map((d) => d.name);
  const designationNames = state.designations.map((d) => d.title);

  return (
    <AdminLayout
      pageTitle="Add New Account"
      breadcrumbs={[
        { label: 'Employees & Accounts', href: '/admin/employees' },
        { label: 'New Account', href: '/admin/accounts/new' },
      ]}
    >
      <div className="space-y-6">
        <AddEmployeeModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            router.push('/admin/employees');
          }}
          onSave={async (emp) => {
            const res = addEmployee(emp);
            return res;
          }}
          departments={departmentNames}
          designations={designationNames}
        />
      </div>
    </AdminLayout>
  );
}
