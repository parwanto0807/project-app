'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Mail,
    Phone,
    MoreHorizontal,
    UserPlus,
} from 'lucide-react';
import Image from 'next/image';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    email: string;
    phone?: string;
    status: 'active' | 'inactive' | 'busy';
    avatar?: string;
}

interface TeamTableProps {
    isLoading?: boolean;
    data?: TeamMember[];
    title?: string;
    showActions?: boolean;
}

export const TeamTable = ({
    isLoading = false,
    data = [],
    title = "Tim PIC",
    showActions = true
}: TeamTableProps) => {
    const getStatusVariant = (status: TeamMember['status']) => {
        switch (status) {
            case 'active':
                return 'default';
            case 'busy':
                return 'secondary';
            case 'inactive':
                return 'outline';
            default:
                return 'default';
        }
    };

    const getStatusText = (status: TeamMember['status']) => {
        switch (status) {
            case 'active':
                return 'Aktif';
            case 'busy':
                return 'Sibuk';
            case 'inactive':
                return 'Non-aktif';
            default:
                return 'Aktif';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Card className="overflow-hidden border border-border/50 shadow-xl h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Users className="h-6 w-6" />
                        {title}
                    </CardTitle>
                    {showActions && (
                        <Button variant="outline" size="sm" className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Tambah Anggota
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center space-x-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                                >
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-[150px]" />
                                        <Skeleton className="h-3 w-[100px]" />
                                    </div>
                                    <Skeleton className="h-8 w-20 rounded-md" />
                                </motion.div>
                            ))
                        ) : data.length > 0 ? (
                            data.map((member, index) => (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center space-x-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group"
                                    whileHover={{ scale: 1.01 }}
                                >
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {member.avatar ? (
                                            <div className="h-12 w-12 rounded-full overflow-hidden">
                                                <Image
                                                    src={member.avatar}
                                                    alt={`Avatar ${member.name}`}
                                                    width={48}
                                                    height={48}
                                                    className="h-12 w-12 object-cover"
                                                    placeholder="blur"
                                                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaUMkQ0sNVT4b6bkpg0sDnj"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                <span className="text-white font-semibold text-sm">
                                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Member Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-sm truncate">
                                                {member.name}
                                            </h3>
                                            <Badge
                                                variant={getStatusVariant(member.status)}
                                                className="text-xs"
                                            >
                                                {getStatusText(member.status)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {member.role}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                <span className="truncate">{member.email}</span>
                                            </div>
                                            {member.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{member.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {showActions && (
                                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center text-muted-foreground py-12"
                            >
                                <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium mb-2">Belum ada anggota tim</p>
                                <p className="text-sm mb-4">Tambahkan anggota tim untuk memulai kolaborasi</p>
                                {showActions && (
                                    <Button className="gap-2">
                                        <UserPlus className="h-4 w-4" />
                                        Tambah Anggota Pertama
                                    </Button>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Team Stats */}
                    {!isLoading && data.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center justify-between pt-6 mt-6 border-t border-border"
                        >
                            <div className="text-sm text-muted-foreground">
                                Total {data.length} anggota tim
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span>
                                        {data.filter(m => m.status === 'active').length} Aktif
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                    <span>
                                        {data.filter(m => m.status === 'busy').length} Sibuk
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};