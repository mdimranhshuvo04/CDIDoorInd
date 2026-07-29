/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  FileText, 
  DollarSign, 
  Calendar, 
  Check, 
  X, 
  Briefcase, 
  Clock, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';

export default function AdminEmployeesPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'salaries' | 'leaves' | 'attendance' | 'tasks'>('directory');
  const [employees, setEmployees] = useState<any[]>([]);
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formType, setFormType] = useState<'monthly' | 'task-based'>('monthly');
  const [formBaseSalary, setFormBaseSalary] = useState('');
  const [formTaskRate, setFormTaskRate] = useState('');
  const [formLetter, setFormLetter] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formWeekendDays, setFormWeekendDays] = useState<string[]>(['Friday']);
  const [formAllowedAbsents, setFormAllowedAbsents] = useState<number>(1);
  const [formAbsentDeductionRate, setFormAbsentDeductionRate] = useState<number>(0);
  const [formBasicSalary, setFormBasicSalary] = useState('');
  const [formAllowance, setFormAllowance] = useState<number>(0);
  const [formDeduction, setFormDeduction] = useState<number>(0);

  const computedBaseSalary = Math.max(0, Number(formBasicSalary || 0) + Number(formAllowance || 0) - Number(formDeduction || 0));

  // Disbursement inputs state
  const [disbursingAmounts, setDisbursingAmounts] = useState<Record<string, string>>({});
  const [disbursingRemarks, setDisbursingRemarks] = useState<Record<string, string>>({});

  // Assign Task states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDescription, setAssignDescription] = useState('');
  const [assignPayout, setAssignPayout] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, salRes, leaveRes, attRes, taskRes] = await Promise.all([
        fetch('/api/admin/employees'),
        fetch('/api/admin/employees/salaries'),
        fetch('/api/admin/employees/leaves'),
        fetch('/api/admin/employees/attendance'),
        fetch('/api/admin/employees/tasks')
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }
      if (salRes.ok) {
        const salData = await salRes.json();
        setDisbursements(salData.disbursements || []);
      }
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setLeaves(leaveData.leaves || []);
      }
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendance(attData.attendance || []);
      }
      if (taskRes.ok) {
        const taskData = await taskRes.json();
        setTasks(taskData.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    if (formWeekendDays && formWeekendDays.length >= 7) {
      toast.error('All 7 days cannot be selected as weekends.');
      return;
    }
    try {
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          phone: formPhone,
          image: formImage,
          employeeType: formType,
          baseSalary: computedBaseSalary,
          taskRate: formTaskRate ? Number(formTaskRate) : 0,
          weekendDays: formWeekendDays,
          allowedAbsents: formAllowedAbsents,
          absentDeductionRate: formAbsentDeductionRate,
          basicSalary: formBasicSalary ? Number(formBasicSalary) : 0,
          allowance: formAllowance,
          deduction: formDeduction
        })
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Employee added successfully',
          confirmButtonColor: '#eab308'
        });
        setShowAddModal(false);
        // Reset form
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setFormPhone('');
        setFormBaseSalary('');
        setFormTaskRate('');
        setFormLetter('');
        setFormImage('');
        setFormWeekendDays(['Friday']);
        setFormAllowedAbsents(1);
        setFormAbsentDeductionRate(0);
        setFormBasicSalary('');
        setFormAllowance(0);
        setFormDeduction(0);
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to add employee');
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  const handleIndividualDisburse = async (emp: any, amount: string, remarks: string) => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Disbursement',
      text: `Are you sure you want to disburse ${Number(amount).toLocaleString()} Tk to ${emp.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Disburse',
      confirmButtonColor: '#eab308',
      cancelButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('/api/admin/employees/salaries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: emp._id,
            amount: Number(amount),
            type: emp.employeeType === 'monthly' ? 'monthly_salary' : 'task_payment',
            remarks: remarks
          })
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Paid!',
            text: `Successfully disbursed payment to ${emp.name}`,
            confirmButtonColor: '#eab308'
          });
          // Clear remarks for this employee
          setDisbursingRemarks(prev => ({
            ...prev,
            [emp._id]: ''
          }));
          fetchData();
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to process payment');
        }
      } catch (err) {
        toast.error('Something went wrong');
      }
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmployeeId || !assignTitle || !assignPayout) {
      toast.error('Employee, Title, and Payout amount are required');
      return;
    }
    try {
      const response = await fetch('/api/admin/employees/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: assignEmployeeId,
          title: assignTitle,
          description: assignDescription,
          payout: Number(assignPayout),
          dueDate: assignDueDate || undefined
        })
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Assigned!',
          text: 'Task assigned successfully to the employee',
          confirmButtonColor: '#eab308'
        });
        setShowAssignModal(false);
        setAssignEmployeeId('');
        setAssignTitle('');
        setAssignDescription('');
        setAssignPayout('');
        setAssignDueDate('');
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to assign task');
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  const handleDeleteTask = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the pending task assignment!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/employees/tasks/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          toast.success('Task deleted successfully');
          fetchData();
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to delete task');
        }
      } catch (err) {
        toast.error('Something went wrong');
      }
    }
  };

  const handleDisburseTaskPayout = async (task: any) => {
    const result = await Swal.fire({
      title: 'Disburse Task Payout',
      text: `Are you sure you want to disburse ${task.payout.toLocaleString()} Tk for "${task.title}" to ${task.employee?.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Disburse',
      confirmButtonColor: '#eab308',
      cancelButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      try {
        // 1. Create salary disbursement record
        const salResponse = await fetch('/api/admin/employees/salaries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: task.employee?._id || task.employee,
            amount: task.payout,
            type: 'task_payment',
            remarks: `Payout for completed task: ${task.title}`
          })
        });

        if (!salResponse.ok) {
          const data = await salResponse.json();
          toast.error(data.message || 'Failed to disburse salary record');
          return;
        }

        // 2. Mark task status as Paid
        const taskResponse = await fetch(`/api/admin/employees/tasks/${task._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Paid' })
        });

        if (taskResponse.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Payout Disbursed!',
            text: 'Disbursement logged and task marked as Paid',
            confirmButtonColor: '#eab308'
          });
          fetchData();
        } else {
          toast.error('Payment logged, but failed to update task status to Paid');
        }
      } catch (err) {
        toast.error('Something went wrong');
      }
    }
  };

  const handleUpdateLeaveStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    const result = await Swal.fire({
      title: `Are you sure to mark this leave as ${status.toLowerCase()}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      confirmButtonColor: '#eab308',
      cancelButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/employees/leaves/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });

        if (response.ok) {
          toast.success(`Leave request ${status.toLowerCase()}!`);
          fetchData();
        } else {
          toast.error('Failed to update leave request');
        }
      } catch (err) {
        toast.error('Something went wrong');
      }
    }
  };

  const handleRevokeRole = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will revoke their employee status and access!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Revoke',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/employees/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Revoked',
            text: 'Employee status has been removed.',
            confirmButtonColor: '#eab308'
          });
          fetchData();
        } else {
          toast.error('Failed to revoke role');
        }
      } catch (err) {
        toast.error('Something went wrong');
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-950">Employee Directory</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage staff, payroll disbursements, leave applications, and daily attendance logs.</p>
        </div>
        <div className="flex gap-2.5">
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-primary-foreground font-bold flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'directory' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          Staff List ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('salaries')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'salaries' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          Disbursements ({disbursements.length})
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'leaves' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          Leave Applications ({leaves.filter(l => l.status === 'Pending').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'attendance' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          Attendance Log
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          Tasks Assignments ({tasks.filter(t => t.status !== 'Paid').length} Active)
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab 1: Staff Directory */}
          {activeTab === 'directory' && (
            <Card className="border border-zinc-200">
              <CardContent className="p-0">
                {employees.length === 0 ? (
                  <div className="text-center py-16 text-zinc-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-60" />
                    <p className="font-medium">No employees found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
                          <th className="p-4">Name</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Compensation</th>
                          <th className="p-4">Joined Date</th>
                          <th className="p-4">Appointment Letter</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((emp) => (
                          <tr key={emp._id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                            <td className="p-4 font-bold text-zinc-900">
                              <div className="flex items-center gap-3">
                                {emp.image ? (
                                  <img 
                                    src={emp.image} 
                                    alt={emp.name} 
                                    className="h-9 w-9 rounded-full object-cover border border-zinc-200"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                    {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                                  </div>
                                )}
                                <div>
                                  <div>{emp.name}</div>
                                  <div className="text-xs text-zinc-400 font-normal">{emp.email}</div>
                                  {emp.phone && <div className="text-[11px] text-zinc-500 font-normal">{emp.phone}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant={emp.employeeType === 'monthly' ? 'default' : 'secondary'} className="font-bold">
                                {emp.employeeType === 'monthly' ? 'Monthly Salary' : 'Task-based'}
                              </Badge>
                            </td>
                            <td className="p-4 font-black text-zinc-800">
                              {emp.employeeType === 'monthly' 
                                ? `${emp.baseSalary?.toLocaleString()} Tk/Mo` 
                                : 'Task Wise'}
                            </td>
                            <td className="p-4 text-zinc-500">
                              {new Date(emp.joinedDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                            </td>
                            <td className="p-4">
                              <a 
                                href={`/appointment-letter/${emp._id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary font-bold hover:underline flex items-center gap-1.5"
                              >
                                <FileText className="h-4 w-4" /> View Letter
                              </a>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end items-center gap-1.5">
                                {emp.employeeType === 'task-based' && (
                                  <Button
                                    onClick={() => {
                                      setAssignEmployeeId(emp._id);
                                      setAssignPayout('');
                                      setShowAssignModal(true);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 border-zinc-200 text-zinc-700 font-bold flex items-center gap-1 hover:bg-zinc-50"
                                  >
                                    <Briefcase className="h-3.5 w-3.5" /> Assign Task
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleRevokeRole(emp._id)}
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:bg-red-50 h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab 2: Disbursements */}
          {activeTab === 'salaries' && (
            <div className="space-y-6">
              {/* Section A: Disburse Salary/Compensation */}
              <Card className="border border-zinc-200">
                <CardHeader className="bg-zinc-50/50 border-b border-zinc-200 p-5 pb-4">
                  <CardTitle className="text-lg font-black text-zinc-900">Disburse Salary/Compensation</CardTitle>
                  <CardDescription className="text-sm text-zinc-500">Record payments to individual employees. Adjust the amounts and add remarks as needed.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {employees.filter(emp => emp.employeeType !== 'task-based').length === 0 ? (
                    <div className="text-center py-10 text-zinc-400">No monthly salary employees registered yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
                            <th className="p-4">Employee</th>
                            <th className="p-4">Type</th>
                            <th className="p-4 w-[180px]">Payable Amount (Tk)</th>
                            <th className="p-4 max-w-[280px]">Remarks / Period</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.filter(emp => emp.employeeType !== 'task-based').map((emp) => {
                            const defaultAmount = (emp.baseSalary || 0).toString();
                            const currentAmount = disbursingAmounts[emp._id] ?? defaultAmount;
                            const currentRemarks = disbursingRemarks[emp._id] ?? '';

                            return (
                              <tr key={emp._id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                                <td className="p-4 font-bold text-zinc-900">
                                  {emp.name}
                                  <div className="text-xs text-zinc-400 font-normal">{emp.email}</div>
                                </td>
                                <td className="p-4">
                                  <Badge variant={emp.employeeType === 'monthly' ? 'default' : 'secondary'} className="font-bold">
                                    {emp.employeeType === 'monthly' ? 'Monthly Salary' : 'Task-based'}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <Input
                                    type="number"
                                    value={currentAmount}
                                    onChange={(e) => setDisbursingAmounts({
                                      ...disbursingAmounts,
                                      [emp._id]: e.target.value
                                    })}
                                    className="h-8 max-w-[140px] font-bold text-sm bg-white border-zinc-200"
                                  />
                                </td>
                                <td className="p-4">
                                  <Input
                                    type="text"
                                    placeholder="e.g. July Salary / 5 tasks"
                                    value={currentRemarks}
                                    onChange={(e) => setDisbursingRemarks({
                                      ...disbursingRemarks,
                                      [emp._id]: e.target.value
                                    })}
                                    className="h-8 w-full max-w-[240px] text-xs bg-white border-zinc-200"
                                  />
                                </td>
                                <td className="p-4 text-right">
                                  <Button
                                    onClick={() => handleIndividualDisburse(emp, currentAmount, currentRemarks)}
                                    size="sm"
                                    className="bg-primary text-primary-foreground font-bold h-8 flex items-center gap-1.5"
                                  >
                                    <DollarSign className="h-3.5 w-3.5" /> Disburse
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section B: Disbursement History */}
              <Card className="border border-zinc-200">
                <CardHeader className="bg-zinc-50/50 border-b border-zinc-200 p-5 pb-4">
                  <CardTitle className="text-lg font-black text-zinc-900">Disbursement History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {disbursements.length === 0 ? (
                    <div className="text-center py-16 text-zinc-400">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-60" />
                      <p className="font-medium">No disbursements recorded yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
                            <th className="p-4">Employee</th>
                            <th className="p-4">Payment Type</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {disbursements.map((dis) => (
                            <tr key={dis._id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                              <td className="p-4 font-bold text-zinc-900">
                                {dis.employee?.name || 'Unknown User'}
                                <div className="text-xs text-zinc-400 font-normal">{dis.employee?.email}</div>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className="font-bold">
                                  {dis.type === 'monthly_salary' ? 'Monthly salary' : 'Task compensation'}
                                </Badge>
                              </td>
                              <td className="p-4 font-black text-green-600">
                                +{dis.amount?.toLocaleString()} Tk
                              </td>
                              <td className="p-4 text-zinc-500">
                                {new Date(dis.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                              </td>
                              <td className="p-4 text-zinc-600 italic">
                                {dis.remarks || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab 3: Leave Applications */}
          {activeTab === 'leaves' && (
            <Card className="border border-zinc-200">
              <CardContent className="p-0">
                {leaves.length === 0 ? (
                  <div className="text-center py-16 text-zinc-400">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-60" />
                    <p className="font-medium">No leave applications found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
                          <th className="p-4">Employee</th>
                          <th className="p-4">Leave Duration</th>
                          <th className="p-4">Reason</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.map((leave) => (
                          <tr key={leave._id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                            <td className="p-4 font-bold text-zinc-900">
                              {leave.employee?.name || 'Unknown User'}
                              <div className="text-xs text-zinc-400 font-normal">{leave.employee?.email}</div>
                            </td>
                            <td className="p-4 text-zinc-700">
                              <div>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</div>
                              <div className="text-xs text-zinc-400 font-bold mt-0.5">
                                {Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Days
                              </div>
                            </td>
                            <td className="p-4 text-zinc-600 max-w-[200px] truncate" title={leave.reason}>
                              {leave.reason}
                            </td>
                            <td className="p-4">
                              <Badge 
                                className="font-bold" 
                                variant={leave.status === 'Approved' ? 'default' : leave.status === 'Rejected' ? 'destructive' : 'secondary'}
                              >
                                {leave.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              {leave.status === 'Pending' && (
                                <div className="flex justify-end gap-1.5">
                                  <Button 
                                    onClick={() => handleUpdateLeaveStatus(leave._id, 'Approved')}
                                    size="sm"
                                    className="bg-green-600 text-white hover:bg-green-700 h-8"
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                                  </Button>
                                  <Button 
                                    onClick={() => handleUpdateLeaveStatus(leave._id, 'Rejected')}
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                                  >
                                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab 4: Attendance Log */}
          {activeTab === 'attendance' && (
            <Card className="border border-zinc-200">
              <CardContent className="p-0">
                {attendance.length === 0 ? (
                  <div className="text-center py-16 text-zinc-400">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-60" />
                    <p className="font-medium">No attendance logs found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
                          <th className="p-4">Employee</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Check In</th>
                          <th className="p-4">Check Out</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((att) => (
                          <tr key={att._id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                            <td className="p-4 font-bold text-zinc-900">
                              {att.employee?.name || 'Unknown User'}
                              <div className="text-xs text-zinc-400 font-normal">{att.employee?.email}</div>
                            </td>
                            <td className="p-4 text-zinc-700">
                              {att.date}
                            </td>
                            <td className="p-4 text-zinc-600 font-medium">
                              {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </td>
                            <td className="p-4 text-zinc-600 font-medium">
                              {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </td>
                            <td className="p-4">
                              <Badge 
                                className="font-bold" 
                                variant={att.status === 'Present' ? 'default' : att.status === 'Late' ? 'secondary' : 'destructive'}
                              >
                                {att.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab 5: Task Assignments */}
          {activeTab === 'tasks' && (
            <Card className="border border-zinc-200">
              <CardHeader className="bg-zinc-50/50 border-b border-zinc-200 p-5 flex flex-row items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-lg font-black text-zinc-900">Task Assignments</CardTitle>
                  <CardDescription className="text-sm text-zinc-500">Assign task-based work to contractual employees and manage payouts upon completion.</CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    const taskEmps = employees.filter(e => e.employeeType === 'task-based');
                    if (taskEmps.length > 0) {
                      setAssignEmployeeId(taskEmps[0]._id);
                      setAssignPayout('');
                    } else {
                      setAssignEmployeeId('');
                      setAssignPayout('');
                    }
                    setShowAssignModal(true);
                  }}
                  className="bg-primary text-primary-foreground font-bold flex items-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" /> Assign New Task
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {tasks.length === 0 ? (
                  <div className="text-center py-16 text-zinc-400">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-60" />
                    <p className="font-medium">No tasks assigned yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
                          <th className="p-4">Employee</th>
                          <th className="p-4">Task Details</th>
                          <th className="p-4">Payout</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Dates</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => (
                          <tr key={task._id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                            <td className="p-4 font-bold text-zinc-900">
                              {task.employee?.name || 'Unknown User'}
                              <div className="text-xs text-zinc-400 font-normal">{task.employee?.email}</div>
                            </td>
                            <td className="p-4 max-w-[280px]">
                              <div className="font-bold text-zinc-900">{task.title}</div>
                              {task.description && <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2" title={task.description}>{task.description}</div>}
                            </td>
                            <td className="p-4 font-black text-zinc-800">
                              {task.payout?.toLocaleString()} Tk
                            </td>
                            <td className="p-4">
                              <Badge 
                                className="font-bold" 
                                variant={
                                  task.status === 'Paid' 
                                    ? 'default' 
                                    : task.status === 'Completed' 
                                    ? 'secondary' 
                                    : 'outline'
                                }
                              >
                                {task.status === 'Paid' ? 'Paid Out' : task.status === 'Completed' ? 'Completed' : 'Pending Work'}
                              </Badge>
                            </td>
                            <td className="p-4 text-xs text-zinc-500">
                              <div><span className="font-semibold">Assigned:</span> {new Date(task.assignedDate).toLocaleDateString()}</div>
                              {task.dueDate && (
                                <div className="mt-0.5 text-amber-600 font-medium"><span className="font-semibold text-zinc-500">Due:</span> {new Date(task.dueDate).toLocaleDateString()}</div>
                              )}
                              {task.completedDate && (
                                <div className="mt-0.5 text-emerald-600"><span className="font-semibold text-zinc-500">Completed:</span> {new Date(task.completedDate).toLocaleDateString()}</div>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                {task.status === 'Completed' && (
                                  <Button 
                                    onClick={() => handleDisburseTaskPayout(task)}
                                    size="sm"
                                    className="bg-emerald-600 text-white hover:bg-emerald-700 h-8 flex items-center gap-1"
                                  >
                                    <DollarSign className="h-3.5 w-3.5" /> Disburse
                                  </Button>
                                )}
                                {task.status === 'Pending' && (
                                  <Button
                                    onClick={() => handleDeleteTask(task._id)}
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                                {task.status === 'Paid' && (
                                  <span className="text-xs text-zinc-400 italic font-medium flex items-center justify-center p-1 bg-zinc-100 rounded">Paid & Cleared</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border border-zinc-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-5 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-zinc-900">Register New Staff</CardTitle>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleAddEmployee} className="flex flex-col flex-1 overflow-hidden">
              <CardContent className="p-5 space-y-4 overflow-y-auto flex-1">
                <ImageUpload 
                  aspect="circle" 
                  value={formImage} 
                  onUpload={setFormImage} 
                  label="Profile Photo"
                />
                <div className="space-y-1.5">
                  <Label htmlFor="empName">Full Name</Label>
                  <Input 
                    id="empName"
                    required
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    placeholder="John Doe" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="empEmail">Email Address</Label>
                  <Input 
                    id="empEmail"
                    type="email"
                    required
                    value={formEmail} 
                    onChange={(e) => setFormEmail(e.target.value)} 
                    placeholder="john@example.com" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="empPass">Password</Label>
                  <Input 
                    id="empPass"
                    type="password"
                    required
                    value={formPassword} 
                    onChange={(e) => setFormPassword(e.target.value)} 
                    placeholder="••••••••" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="empPhone">Phone</Label>
                    <Input 
                      id="empPhone"
                      value={formPhone} 
                      onChange={(e) => setFormPhone(e.target.value)} 
                      placeholder="+880 1700..." 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="empType">Compensation Type</Label>
                    <Select 
                      onValueChange={(val: any) => setFormType(val)} 
                      value={formType}
                    >
                      <SelectTrigger id="empType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly Salary</SelectItem>
                        <SelectItem value="task-based">Task-based Pay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formType === 'monthly' && (
                  <div className="space-y-4 pt-2 border-t border-zinc-100">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-emerald-800">Weekend Days (Default: Friday)</Label>
                      <div className="grid grid-cols-4 gap-2 bg-emerald-50/20 p-3 rounded-lg border border-emerald-100/30">
                        {['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].map((day) => (
                          <label key={day} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-zinc-700">
                            <input
                              type="checkbox"
                              checked={formWeekendDays.includes(day)}
                              onChange={() => {
                                if (formWeekendDays.includes(day)) {
                                  setFormWeekendDays(formWeekendDays.filter(d => d !== day));
                                } else if (formWeekendDays.length < 6) {
                                  setFormWeekendDays([...formWeekendDays, day]);
                                }
                              }}
                              className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span>{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="allowedAbsents" className="text-xs font-bold uppercase tracking-wider text-emerald-800">Allowed Absents Per Month</Label>
                        <Input
                          id="allowedAbsents"
                          type="number"
                          min="0"
                          value={formAllowedAbsents}
                          onChange={(e) => setFormAllowedAbsents(Number(e.target.value))}
                          placeholder="e.g. 1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="absentDeductionRate" className="text-xs font-bold uppercase tracking-wider text-emerald-800">Absent Deduction Rate (৳/Day)</Label>
                        <Input
                          id="absentDeductionRate"
                          type="number"
                          min="0"
                          value={formAbsentDeductionRate}
                          onChange={(e) => setFormAbsentDeductionRate(Number(e.target.value))}
                          placeholder="e.g. 0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-emerald-800">Salary Structure</Label>
                      <div className="grid grid-cols-3 gap-3 bg-zinc-50/50 p-3 rounded-lg border border-zinc-200">
                        <div className="space-y-1">
                          <Label htmlFor="basicSal" className="text-[11px] text-zinc-500">Basic (৳) *</Label>
                          <Input
                            id="basicSal"
                            type="number"
                            required
                            value={formBasicSalary}
                            onChange={(e) => {
                              const basic = e.target.value;
                              setFormBasicSalary(basic);
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="allowanceSal" className="text-[11px] text-zinc-500">Allowance (৳)</Label>
                          <Input
                            id="allowanceSal"
                            type="number"
                            value={formAllowance}
                            onChange={(e) => {
                              const allowance = Number(e.target.value);
                              setFormAllowance(allowance);
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="deductionSal" className="text-[11px] text-zinc-500">Deduction (৳)</Label>
                          <Input
                            id="deductionSal"
                            type="number"
                            value={formDeduction}
                            onChange={(e) => {
                              const deduction = Number(e.target.value);
                              setFormDeduction(deduction);
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      {computedBaseSalary > 0 && (
                        <p className="text-xs font-bold text-zinc-700 text-right mt-1.5">
                          Calculated Base Salary: <span className="text-emerald-700 font-extrabold">৳{computedBaseSalary.toLocaleString()}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2 shrink-0">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-primary-foreground font-bold">Register Employee</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Assign Task Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in duration-200">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-zinc-900">Assign Task to Staff</CardTitle>
                <button 
                  onClick={() => setShowAssignModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleAssignTask}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="assignEmp">Select Employee</Label>
                  <Select 
                    onValueChange={(val: any) => {
                      setAssignEmployeeId(val || '');
                    }} 
                    value={assignEmployeeId}
                  >
                    <SelectTrigger id="assignEmp">
                      <SelectValue placeholder="Choose task-based staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.filter(e => e.employeeType === 'task-based').map((emp) => (
                        <SelectItem key={emp._id} value={emp._id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taskTitle">Task Title</Label>
                  <Input 
                    id="taskTitle"
                    required
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                    placeholder="e.g. Design main entrance double door"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taskDesc">Description (Optional)</Label>
                  <Input 
                    id="taskDesc"
                    value={assignDescription}
                    onChange={(e) => setAssignDescription(e.target.value)}
                    placeholder="Describe specific requirements, dimensions, etc."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taskPayout">Payout Amount (Tk)</Label>
                  <Input 
                    id="taskPayout"
                    type="number"
                    required
                    value={assignPayout}
                    onChange={(e) => setAssignPayout(e.target.value)}
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taskDueDate">Expected Completion Date</Label>
                  <Input 
                    id="taskDueDate"
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                  />
                </div>
              </CardContent>
              <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowAssignModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-primary-foreground font-bold">Assign Task</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
