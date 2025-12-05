import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2 } from "lucide-react"; // Tambahkan Loader2
import { PRStatus } from "../types";
import SearchInput from "@/components/shared/SearchInput";

interface TableHeaderProps {
  searchInput: string;
  showFilters: boolean;
  localDateFrom: string;
  localDateTo: string;
  currentStatus?: PRStatus;
  currentProjectId?: string;
  projects?: Array<{
    id: string | null;
    name: string | null;
  }>;
  onSearchSubmit: (e: React.FormEvent) => void;
  onSearchChange: (value: string) => void;
  onShowFiltersChange: (show: boolean) => void;
  onLocalDateFromChange: (date: string) => void;
  onLocalDateToChange: (date: string) => void;
  onStatusFilterChange: (status: PRStatus | undefined) => void;
  onProjectFilterChange: (projectId: string) => void;
  onDateFilterApply: () => void;
  onClearDateFilters: () => void;
  onClearFilters: () => void;
  userLoading?: boolean;
  isDataFetching?: boolean;
}

export function TableHeader({
  searchInput,
  showFilters,
  localDateFrom,
  localDateTo,
  currentStatus,
  currentProjectId,
  projects,
  onSearchChange,
  onLocalDateFromChange,
  onLocalDateToChange,
  onStatusFilterChange,
  onProjectFilterChange,
  onDateFilterApply,
  onClearDateFilters,
  onClearFilters,
  userLoading = false,
  isDataFetching = false,
}: TableHeaderProps) {
  const handleStatusChange = (value: string) => {
    const status = value === "" ? undefined : value as PRStatus;
    onStatusFilterChange(status);
  };

  const handleSearch = (searchValue: string) => {
    onSearchChange(searchValue);
  };

  // Combined loading state
  const isLoading = userLoading || isDataFetching;

  // console.log('🔍 TableHeader Debug:');
  // console.log('   - isLoading:', isLoading);
  // console.log('   - userLoading:', userLoading);
  // console.log('   - isDataFetching:', isDataFetching);

  return (
    <div className="w-full">
      {/* Loading Overlay */}
      {/* {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-lg border">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Loading data...
            </span>
          </div>
        </div>
      )} */}

      {/* Search and Filters Section */}
      <div className="flex flex-col sm:flex-row gap-3 w-full items-start sm:items-center relative">
        {/* Search Bar dengan Loading Indicator */}
        <div className="w-full sm:flex-1 max-w-md relative">
          <SearchInput
            onSearch={handleSearch}
            placeholder="Search PR..."
            className="w-full"
            disabled={isLoading}
            initialValue={searchInput}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Filters Container */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Status Filter dengan Loading State */}
          <div className="relative">
            <Select
              value={currentStatus || ""}
              onValueChange={handleStatusChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm bg-white text-black border-gray-300">
                <SelectValue placeholder={
                  isLoading ? "Loading..." : "Status"
                } />
              </SelectTrigger>
              <SelectContent className="bg-white text-black border-gray-300">
                <SelectItem value="DRAFT" className="text-xs sm:text-sm text-black hover:bg-gray-100">Draft</SelectItem>
                <SelectItem value="REVISION_NEEDED" className="text-xs sm:text-sm text-black hover:bg-gray-100">Revision Needed</SelectItem>
                <SelectItem value="SUBMITTED" className="text-xs sm:text-sm text-black hover:bg-gray-100">Submitted</SelectItem>
                <SelectItem value="APPROVED" className="text-xs sm:text-sm text-black hover:bg-gray-100">Approved</SelectItem>
                <SelectItem value="REJECTED" className="text-xs sm:text-sm text-black hover:bg-gray-100">Rejected</SelectItem>
                <SelectItem value="COMPLETED" className="text-xs sm:text-sm text-black hover:bg-gray-100">Completed</SelectItem>
              </SelectContent>
            </Select>
            {isLoading && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* Project Filter dengan Loading State */}
          <div className="relative">
            <Select
              value={currentProjectId || ""}
              onValueChange={onProjectFilterChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm bg-white text-black border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder={
                  isLoading ? "Loading..." : "Project"
                } />
              </SelectTrigger>
              <SelectContent className="bg-white text-black border-gray-300 shadow-lg">
                {projects?.map((project) => (
                  <SelectItem
                    key={project.id}
                    value={project.id || ""}
                    className="text-xs sm:text-sm text-black hover:bg-blue-50 hover:text-black focus:bg-blue-50 focus:text-black"
                  >
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoading && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* Clear Filters Button dengan Loading State */}
          <Button
            variant="outline"
            onClick={onClearFilters}
            disabled={isLoading}
            className="w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap text-black flex items-center justify-center dark:text-white disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
            ) : (
              <X className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            )}
            {isLoading ? "Loading..." : "Clear"}
          </Button>
        </div>
      </div>

      {/* Date Filters Section */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 p-3 sm:p-4 border rounded-lg bg-muted/50 mt-4 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg z-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="flex flex-col space-y-2 flex-1">
              <label className="text-xs sm:text-sm font-medium">From Date</label>
              <input
                type="date"
                value={localDateFrom}
                onChange={(e) => onLocalDateFromChange(e.target.value)}
                className="w-full text-xs sm:text-sm border rounded-md px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col space-y-2 flex-1">
              <label className="text-xs sm:text-sm font-medium">To Date</label>
              <input
                type="date"
                value={localDateTo}
                onChange={(e) => onLocalDateToChange(e.target.value)}
                className="w-full text-xs sm:text-sm border rounded-md px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={onDateFilterApply}
              className="whitespace-nowrap text-xs sm:text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin mr-2" />
              ) : null}
              {isLoading ? "Applying..." : "Apply Dates"}
            </Button>
            <Button
              variant="outline"
              onClick={onClearDateFilters}
              className="whitespace-nowrap text-xs sm:text-sm"
              disabled={isLoading}
            >
              Clear Dates
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}