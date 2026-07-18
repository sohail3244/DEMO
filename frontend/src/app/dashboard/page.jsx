"use client";

import { useEffect, useState } from "react";
import {
  Link2,
  Link,
  Eye,
  Calendar,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Edit,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import useLinks from "@/lib/hooks/useLinks";

export default function LinkManagementPage() {
  const { loading, createLink, getAllLinks, updateLink, deleteLink } =
    useLinks();

  const [links, setLinks] = useState([]);
  const [filteredLinks, setFilteredLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    expiryDate: "",
    isActive: true,
  });

  const fetchLinks = async () => {
    try {
      const data = await getAllLinks();
      // Handle both array and object responses
      const linksArray = Array.isArray(data) ? data : data?.links || data?.data || [];
      setLinks(linksArray);
      setFilteredLinks(linksArray);
    } catch (error) {
      toast.error("Failed to fetch links");
      setLinks([]);
      setFilteredLinks([]);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  useEffect(() => {
    let result = Array.isArray(links) ? links : [];

    if (searchTerm) {
      result = result.filter((link) =>
        link.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((link) => link.status === statusFilter);
    }

    setFilteredLinks(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, links]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLinks();
    setIsRefreshing(false);
    toast.success("Links refreshed");
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      await createLink(formData);
      toast.success("Link created successfully");
      setIsCreateModalOpen(false);
      setFormData({ title: "", expiryDate: "", isActive: true });
      await fetchLinks();
    } catch (error) {
      toast.error("Failed to create link");
    }
  };

  const handleUpdateLink = async (e) => {
    e.preventDefault();
    try {
      await updateLink(selectedLink.id, formData);
      toast.success("Link updated successfully");
      setIsEditModalOpen(false);
      setSelectedLink(null);
      setFormData({ title: "", expiryDate: "", isActive: true });
      await fetchLinks();
    } catch (error) {
      toast.error("Failed to update link");
    }
  };

  const handleDeleteLink = async () => {
    try {
      await deleteLink(selectedLink.id);
      toast.success("Link deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedLink(null);
      await fetchLinks();
    } catch (error) {
      toast.error("Failed to delete link");
    }
  };

  const handleCopyLink = (token) => {
    const url = `${window.location.origin}/capture/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const openEditModal = (link) => {
    setSelectedLink(link);
    setFormData({
      title: link.title || "",
      expiryDate: link.expiryDate ? link.expiryDate.split("T")[0] : "",
      isActive: link.isActive ?? true,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (link) => {
    setSelectedLink(link);
    setIsDeleteModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: "bg-green-100 text-black border border-green-300",
      inactive: "bg-gray-100 text-black border border-gray-300",
      expired: "bg-red-100 text-black border border-red-300",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusMap[status] || "bg-gray-100 text-black border border-gray-300"
        }`}
      >
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Calculate stats - ensure links is an array
  const linksArray = Array.isArray(links) ? links : [];
  const totalLinks = linksArray.length;
  const activeLinks = linksArray.filter((l) => l.status === "active").length;
  const expiredLinks = linksArray.filter((l) => l.status === "expired").length;
  const totalCaptures = linksArray.reduce((sum, l) => sum + (l.captureCount || 0), 0);

  const statsCards = [
    {
      title: "Total Links",
      value: totalLinks,
      icon: Link2,
      color: "bg-blue-50 text-black",
    },
    {
      title: "Active Links",
      value: activeLinks,
      icon: Link,
      color: "bg-green-50 text-black",
    },
    {
      title: "Expired Links",
      value: expiredLinks,
      icon: Calendar,
      color: "bg-red-50 text-black",
    },
    {
      title: "Total Captures",
      value: totalCaptures,
      icon: Eye,
      color: "bg-purple-50 text-black",
    },
  ];

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLinks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse mt-2"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-black">
              Link Management
            </h1>
            <p className="text-black mt-1">
              Manage all image capture links.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Link
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">
                      {stat.title}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-black mt-1">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6 text-black" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
              <input
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-black"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-black"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 text-black ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Capture URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Capture Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length > 0 ? (
                  currentItems.map((link) => (
                    <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                        {link.title || "Untitled"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs text-black">
                          /capture/{link.token}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-mono">
                        {link.token?.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(link.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {link.captureCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {formatDate(link.expiryDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {formatDate(link.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyLink(link.token)}
                            className="p-1 text-black hover:text-blue-600 transition-colors"
                            title="Copy Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(link)}
                            className="p-1 text-black hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(link)}
                            className="p-1 text-black hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <Link2 className="w-8 h-8 text-black" />
                        </div>
                        <p className="text-black font-medium">
                          No Links Found
                        </p>
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Link
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredLinks.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-black">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredLinks.length)} of{" "}
                {filteredLinks.length} results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-black hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-black">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-black hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-black">
                Create New Link
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-black hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLink}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-black">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-black">
                Edit Link
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-black hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateLink}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-black">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">
                    Delete Link
                  </h3>
                  <p className="text-black mt-1">
                    Are you sure you want to delete "{selectedLink?.title}"?
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLink}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}