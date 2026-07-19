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

export default function AdminEmployeesPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'salaries' | 'leaves' | 'attendance'>('directory');
  const [employees, setEmployees] = useState<any[]>([]);
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
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

  // Disbursement Form states
  const [showPayModal, setShowPayModal] = useState(false);
  const [payEmployeeId, setPayEmployeeId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [payType, setPayType] = useState<'monthly_salary' | 'task_payment'>('monthly_salary');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, salRes, leaveRes, attRes] = await Promise.all([
        fetch('/api/admin/employees'),
        fetch('/api/admin/employees/salaries'),
        fetch('/api/admin/employees/leaves'),
        fetch('/api/admin/employees/attendance')
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
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          phone: formPhone,
          employeeType: formType,
          baseSalary: formBaseSalary ? Number(formBaseSalary) : 0,
          taskRate: formTaskRate ? Number(formTaskRate) : 0,
          appointmentLetter: formLetter,
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
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to add employee');
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  const handlePayEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/employees/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: payEmployeeId,
          amount: Number(payAmount),
          type: payType,
          remarks: payRemarks
        })
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Paid!',
          text: 'Disbursement logged successfully',
          confirmButtonColor: '#eab308'
        });
        setShowPayModal(false);
        setPayEmployeeId('');
        setPayAmount('');
        setPayRemarks('');
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to process payment');
      }
    } catch (err) {
      toast.error('Something went wrong');
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
          <Button 
            onClick={() => setShowPayModal(true)}
            variant="outline"
            className="border-zinc-200 text-zinc-800 font-bold flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" /> Disburse Payment
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
                              <div>{emp.name}</div>
                              <div className="text-xs text-zinc-400 font-normal">{emp.email}</div>
                              {emp.phone && <div className="text-[11px] text-zinc-500 font-normal">{emp.phone}</div>}
                            </td>
                            <td className="p-4">
                              <Badge variant={emp.employeeType === 'monthly' ? 'default' : 'secondary'} className="font-bold">
                                {emp.employeeType === 'monthly' ? 'Monthly Salary' : 'Task-based'}
                              </Badge>
                            </td>
                            <td className="p-4 font-black text-zinc-800">
                              {emp.employeeType === 'monthly' 
                                ? `${emp.baseSalary?.toLocaleString()} Tk/Mo` 
                                : `${emp.taskRate?.toLocaleString()} Tk/Task`}
                            </td>
                            <td className="p-4 text-zinc-500">
                              {new Date(emp.joinedDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                            </td>
                            <td className="p-4">
                              {emp.appointmentLetter ? (
                                <a 
                                  href={emp.appointmentLetter} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary font-bold hover:underline flex items-center gap-1.5"
                                >
                                  <FileText className="h-4 w-4" /> View Letter
                                </a>
                              ) : (
                                <span className="text-zinc-400 italic text-xs">Not uploaded</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                onClick={() => handleRevokeRole(emp._id)}
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
            <Card className="border border-zinc-200">
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
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border border-zinc-200 shadow-xl overflow-hidden">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-5">
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
            <form onSubmit={handleAddEmployee}>
              <CardContent className="p-5 space-y-4">
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
                {formType === 'monthly' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="baseSalary">Monthly Salary (Tk)</Label>
                    <Input 
                      id="baseSalary"
                      type="number"
                      value={formBaseSalary} 
                      onChange={(e) => setFormBaseSalary(e.target.value)} 
                      placeholder="e.g. 25000" 
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="taskRate">Rate Per Task (Tk)</Label>
                    <Input 
                      id="taskRate"
                      type="number"
                      value={formTaskRate} 
                      onChange={(e) => setFormTaskRate(e.target.value)} 
                      placeholder="e.g. 500" 
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="letter">Appointment Letter URL</Label>
                  <Input 
                    id="letter"
                    value={formLetter} 
                    onChange={(e) => setFormLetter(e.target.value)} 
                    placeholder="e.g. /assets/docs/appointment-letter.pdf" 
                  />
                </div>
              </CardContent>
              <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-primary-foreground font-bold">Register Employee</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Disburse Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border border-zinc-200 shadow-xl overflow-hidden">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-zinc-900">Record Salary/Compensation</CardTitle>
                <button 
                  onClick={() => setShowPayModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handlePayEmployee}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="payEmp">Select Employee</Label>
                  <Select 
                    onValueChange={(val: any) => {
                      setPayEmployeeId(val || '');
                      // Auto-select type based on employee type
                      const emp = employees.find((e) => e._id === val);
                      if (emp) {
                        setPayType(emp.employeeType === 'monthly' ? 'monthly_salary' : 'task_payment');
                        setPayAmount(emp.employeeType === 'monthly' ? emp.baseSalary.toString() : emp.taskRate.toString());
                      }
                    }} 
                    value={payEmployeeId}
                  >
                    <SelectTrigger id="payEmp">
                      <SelectValue placeholder="Choose staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp._id} value={emp._id}>
                          {emp.name} ({emp.employeeType === 'monthly' ? 'Monthly' : 'Task-based'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="payAmount">Amount Paid (Tk)</Label>
                    <Input 
                      id="payAmount"
                      type="number"
                      required
                      value={payAmount} 
                      onChange={(e) => setPayAmount(e.target.value)} 
                      placeholder="e.g. 20000" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="payType">Payment Type</Label>
                    <Select 
                      onValueChange={(val: any) => setPayType(val)} 
                      value={payType}
                    >
                      <SelectTrigger id="payType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly_salary">Monthly Salary</SelectItem>
                        <SelectItem value="task_payment">Task Compensation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payRemarks">Remarks / Period</Label>
                  <Input 
                    id="payRemarks"
                    value={payRemarks} 
                    onChange={(e) => setPayRemarks(e.target.value)} 
                    placeholder="e.g. July 2026 Salary / 5 tasks completed" 
                  />
                </div>
              </CardContent>
              <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowPayModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-primary-foreground font-bold">Record Disbursement</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
