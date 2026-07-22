import { memo, useState, useMemo } from "react";
import {
 ArrowLeft, Plus, ChevronDown, ChevronRight, Trash2, Archive,
 Pencil, Check, X, Tag, Search,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { Toggle } from "./Toggle";
import type { GroupCategory, Subcategory } from "../types";

const EMOJI_GRID = [
 "🍽️","🛒","🍻","🎬","✈️","🚗","🏠","🛍️","🎮","🐶",
 "🎁","📦","📱","🏥","🎓","💊","🎵","🏋️","🎨","🧴",
 "💻","🎪","🌮","🍣","🍕","🎰","🎯","🏄","🎭","🎲",
 "☕","🛒","🛵","🚆","🚕","⛽","💡","📡","🔧","🛋️",
 "👕","📺","🩺","📚","📖","🏨","🚙","💖","🐾","🛒",
];

const PRESET_COLORS = [
 "#f43f5e","#f97316","#eab308","#22c55e","#14b8a6",
 "#3b82f6","#8b5cf6","#ec4899","#6366f1","#0ea5e9",
];

const PRESET_SUBCAT_EMOJIS = [
 "🛒","🍽️","☕","🛵","🚗","🚆","🚕","⛽","🏠","💡",
 "📡","🔧","🛋️","👕","💻","🧴","📺","🎬","🎨","🩺",
 "💊","🏋️","🛡️","📚","📖","🏨","✈️","🚙","💖","🎁",
];

interface EmojiPickerProps {
 onSelect: (emoji: string) => void;
 onClose: () => void;
}

const EmojiPicker = memo(function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
 return (
 <div
 
 
 
 className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
 onClick={onClose}
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className="bg-background border border-border rounded-2xl p-4 w-full max-w-sm shadow-2xl"
 >
 <div className="flex items-center justify-between mb-3">
 <p className="text-sm font-bold">Choisir un emoji</p>
 <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
 <X size={14} />
 </button>
 </div>
 <div className="grid grid-cols-8 gap-1.5 max-h-60 overflow-y-auto scrollbar-thin">
 {EMOJI_GRID.map((emoji, i) => (
 <button
 key={`${emoji}-${i}`}
 onClick={() => { onSelect(emoji); onClose(); }}
 className="w-9 h-9 rounded-xl bg-card/60 border border-border/50 flex items-center justify-center text-xl hover:bg-card hover:border-border transition-colors"
 >
 {emoji}
 </button>
 ))}
 </div>
 </div>
 </div>
 );
});

interface ColorPickerProps {
 value?: string;
 onSelect: (color: string) => void;
}

const ColorPicker = memo(function ColorPicker({ value, onSelect }: ColorPickerProps) {
 return (
 <div className="flex flex-wrap gap-2">
 {PRESET_COLORS.map((c) => (
 <button
 key={c}
 onClick={() => onSelect(c)}
 className={`w-8 h-8 rounded-full border-2 transition-all ${
 value === c ? "border-foreground scale-110 shadow-lg" : "border-transparent hover:scale-105"
 }`}
 style={{ backgroundColor: c }}
 />
 ))}
 </div>
 );
});

interface CategoryCardProps {
 category: GroupCategory;
 isExpanded: boolean;
 onToggleExpand: () => void;
 onToggleActive: (active: boolean) => void;
 onEdit: () => void;
 onArchive: () => void;
 onDelete: () => void;
 onAddSubcategory: () => void;
 onEditSubcategory: (sub: Subcategory) => void;
 onDeleteSubcategory: (subId: string) => void;
 onToggleSubcategoryActive: (subId: string, active: boolean) => void;
 isAdmin: boolean;
}

const CategoryCard = memo(function CategoryCard({
 category, isExpanded, onToggleExpand, onToggleActive,
 onEdit, onArchive, onDelete, onAddSubcategory,
 onEditSubcategory, onDeleteSubcategory, onToggleSubcategoryActive,
 isAdmin,
}: CategoryCardProps) {
 const [editingSubId, setEditingSubId] = useState<string | null>(null);
 const [editingSubName, setEditingSubName] = useState("");
 const [addingSub, setAddingSub] = useState(false);
 const [newSubName, setNewSubName] = useState("");
 const [newSubEmoji, setNewSubEmoji] = useState("📦");
 const [showSubEmojiPicker, setShowSubEmojiPicker] = useState(false);

 const createSub = trpc.equilibra.createSubcategory.useMutation();
 const updateSub = trpc.equilibra.updateSubcategory.useMutation();
 const deleteSub = trpc.equilibra.deleteSubcategory.useMutation();

 const handleCreateSub = async () => {
 if (!newSubName.trim()) return;
 try {
 await createSub.mutateAsync({
 memberId: "", // will be set by server from session
 categoryId: category.id,
 name: newSubName.trim(),
 emoji: newSubEmoji,
 });
 toast.success("Sous-catégorie créée");
 setNewSubName("");
 setNewSubEmoji("📦");
 setAddingSub(false);
 window.location.reload();
 } catch {
 toast.error("Erreur lors de la création");
 }
 };

 const handleUpdateSub = async (subId: string) => {
 if (!editingSubName.trim()) return;
 try {
 await updateSub.mutateAsync({
 memberId: "",
 subcategoryId: subId,
 name: editingSubName.trim(),
 });
 toast.success("Sous-catégorie mise à jour");
 setEditingSubId(null);
 window.location.reload();
 } catch {
 toast.error("Erreur lors de la mise à jour");
 }
 };

 const handleDeleteSub = async (subId: string) => {
 try {
 await deleteSub.mutateAsync({ memberId: "", subcategoryId: subId });
 toast.success("Sous-catégorie supprimée");
 window.location.reload();
 } catch {
 toast.error("Erreur lors de la suppression");
 }
 };

 return (
 <div
 className={`glass-card-enhanced rounded-[1.25rem] overflow-hidden transition-opacity ${
 !category.isActive ? "opacity-50" : ""
 }`}
 >
 <div className="p-4">
 <div className="flex items-center gap-3">
 <button
 onClick={onToggleExpand}
 className="flex items-center gap-3 flex-1 min-w-0"
 >
 <span className="text-2xl shrink-0">{category.emoji}</span>
 <div className="text-left min-w-0 flex-1">
 <p className="text-sm font-bold truncate">{category.name}</p>
 <p className="text-xs text-muted-foreground">
 {category.subcategories.length} sous-catégorie{category.subcategories.length !== 1 ? "s" : ""}
 {category.color && (
 <span className="ml-2 inline-block w-2.5 h-2.5 rounded-full align-middle" style={{ backgroundColor: category.color }} />
 )}
 </p>
 </div>
 <div >
 <ChevronRight size={16} className="text-muted-foreground" />
 </div>
 </button>

 {isAdmin && (
 <div className="flex items-center gap-1.5 shrink-0">
 <button
 onClick={onEdit}
 className="w-8 h-8 rounded-xl bg-secondary/50 flex items-center justify-center"
 >
 <Pencil size={13} className="text-muted-foreground" />
 </button>
 {category.isActive ? (
 <button
 onClick={onArchive}
 className="w-8 h-8 rounded-xl bg-secondary/50 flex items-center justify-center"
 >
 <Archive size={13} className="text-muted-foreground" />
 </button>
 ) : (
 <button
 onClick={onDelete}
 className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center"
 >
 <Trash2 size={13} className="text-red-400" />
 </button>
 )}
 </div>
 )}

 <Toggle enabled={category.isActive} onToggle={() => onToggleActive(!category.isActive)} />
 </div>
 </div>

 
 {isExpanded && (
 <div
 className="overflow-hidden"
 >
 <div className="px-4 pb-4 pt-1 border-t border-border/50">
 {category.subcategories.length > 0 ? (
 <div className="space-y-1.5 mt-2">
 {category.subcategories
 .sort((a, b) => a.sortOrder - b.sortOrder)
 .map((sub) => (
 <div
 key={sub.id}
 className={`flex items-center gap-2 p-2.5 rounded-xl bg-card/40 border border-border/30 ${
 !sub.isActive ? "opacity-50" : ""
 }`}
 >
 <span className="text-base shrink-0">{sub.emoji || category.emoji}</span>
 {editingSubId === sub.id ? (
 <div className="flex items-center gap-1.5 flex-1 min-w-0">
 <input
 type="text"
 value={editingSubName}
 onChange={(e) => setEditingSubName(e.target.value)}
 onKeyDown={(e) => { if (e.key === "Enter") handleUpdateSub(sub.id); if (e.key === "Escape") setEditingSubId(null); }}
 autoFocus
 className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
 />
 <button onClick={() => handleUpdateSub(sub.id)} className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
 <Check size={10} className="text-primary" />
 </button>
 <button onClick={() => setEditingSubId(null)} className="w-6 h-6 rounded-lg bg-secondary/50 flex items-center justify-center">
 <X size={10} />
 </button>
 </div>
 ) : (
 <>
 <span className="text-xs font-medium flex-1 min-w-0 truncate">{sub.name}</span>
 {isAdmin && (
 <div className="flex items-center gap-1 shrink-0">
 <Toggle enabled={sub.isActive} onToggle={() => onToggleSubcategoryActive(sub.id, !sub.isActive)} />
 <button
 onClick={() => { setEditingSubId(sub.id); setEditingSubName(sub.name); }}
 className="w-6 h-6 rounded-lg bg-secondary/50 flex items-center justify-center"
 >
 <Pencil size={9} />
 </button>
 <button
 onClick={() => handleDeleteSub(sub.id)}
 className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center"
 >
 <Trash2 size={9} className="text-red-400" />
 </button>
 </div>
 )}
 </>
 )}
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs text-muted-foreground text-center py-3">Aucune sous-catégorie</p>
 )}

 {isAdmin && (
 <div className="mt-3">
 {addingSub ? (
 <div
 className="flex items-center gap-2"
 >
 <button
 onClick={() => setShowSubEmojiPicker(true)}
 className="w-9 h-9 rounded-xl bg-card/60 border border-border/50 flex items-center justify-center text-lg shrink-0"
 >
 {newSubEmoji}
 </button>
 <input
 type="text"
 value={newSubName}
 onChange={(e) => setNewSubName(e.target.value)}
 onKeyDown={(e) => { if (e.key === "Enter") handleCreateSub(); if (e.key === "Escape") { setAddingSub(false); setNewSubName(""); } }}
 autoFocus
 placeholder="Nom de la sous-catégorie"
 className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
 />
 <button
 onClick={handleCreateSub}
 disabled={!newSubName.trim()}
 className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center disabled:opacity-40"
 >
 <Check size={13} className="text-primary" />
 </button>
 <button
 onClick={() => { setAddingSub(false); setNewSubName(""); }}
 className="w-8 h-8 rounded-xl bg-secondary/50 flex items-center justify-center"
 >
 <X size={13} />
 </button>
 </div>
 ) : (
 <button
 onClick={() => setAddingSub(true)}
 className="w-full py-2.5 rounded-xl border border-dashed border-border text-xs font-medium text-muted-foreground hover:bg-card/50 transition-colors flex items-center justify-center gap-1.5"
 >
 <Plus size={13} />
 Ajouter une sous-catégorie
 </button>
 )}
 </div>
 )}
 </div>
 </div>
 )}
 

 
 {showSubEmojiPicker && (
 <EmojiPicker
 onSelect={(e) => setNewSubEmoji(e)}
 onClose={() => setShowSubEmojiPicker(false)}
 />
 )}
 
 </div>
 );
});

interface CategoryManagementScreenProps {
 currentMemberId: string;
 onBack: () => void;
}

export const CategoryManagementScreen = memo(function CategoryManagementScreen({
 currentMemberId,
 onBack,
}: CategoryManagementScreenProps) {
 const [expandedId, setExpandedId] = useState<string | null>(null);
 const [search, setSearch] = useState("");
 const [showAddModal, setShowAddModal] = useState(false);
 const [editingCategory, setEditingCategory] = useState<GroupCategory | null>(null);

 const [newName, setNewName] = useState("");
 const [newEmoji, setNewEmoji] = useState("📦");
 const [newColor, setNewColor] = useState<string | undefined>(undefined);
 const [showEmojiPicker, setShowEmojiPicker] = useState(false);

 const { data, refetch } = trpc.equilibra.getCategories.useQuery();
 const createCategory = trpc.equilibra.createCategory.useMutation();
 const updateCategory = trpc.equilibra.updateCategory.useMutation();
 const archiveCategory = trpc.equilibra.archiveCategory.useMutation();
 const deleteCategory = trpc.equilibra.deleteCategory.useMutation();
 const updateSubMut = trpc.equilibra.updateSubcategory.useMutation();

 const categories = useMemo(() => data?.categories || [], [data]);

 const filtered = useMemo(() => {
 if (!search.trim()) return categories;
 const q = search.toLowerCase();
 return categories.filter((cat) => {
 const nameMatch = cat.name.toLowerCase().includes(q);
 const subMatch = cat.subcategories.some((s: Subcategory) => s.name.toLowerCase().includes(q));
 return nameMatch || subMatch;
 });
 }, [categories, search]);

 const activeCategories = useMemo(() => filtered.filter((c) => c.isActive), [filtered]);
 const inactiveCategories = useMemo(() => filtered.filter((c) => !c.isActive), [filtered]);

 const resetForm = () => { setNewName(""); setNewEmoji("📦"); setNewColor(undefined); };

 const handleCreate = async () => {
 if (!newName.trim()) return;
 try {
 await createCategory.mutateAsync({
 memberId: currentMemberId,
 name: newName.trim(),
 emoji: newEmoji,
 color: newColor,
 });
 toast.success("Catégorie créée");
 resetForm();
 setShowAddModal(false);
 refetch();
 } catch {
 toast.error("Erreur lors de la création");
 }
 };

 const handleEdit = async () => {
 if (!editingCategory || !newName.trim()) return;
 try {
 await updateCategory.mutateAsync({
 memberId: currentMemberId,
 categoryId: editingCategory.id,
 name: newName.trim(),
 emoji: newEmoji,
 color: newColor,
 });
 toast.success("Catégorie mise à jour");
 resetForm();
 setEditingCategory(null);
 refetch();
 } catch {
 toast.error("Erreur lors de la mise à jour");
 }
 };

 const handleToggleActive = async (cat: GroupCategory, active: boolean) => {
 try {
 await updateCategory.mutateAsync({
 memberId: currentMemberId,
 categoryId: cat.id,
 isActive: active,
 });
 toast.success(active ? "Catégorie activée" : "Catégorie désactivée");
 refetch();
 } catch {
 toast.error("Erreur");
 }
 };

 const handleArchive = async (cat: GroupCategory) => {
 try {
 await archiveCategory.mutateAsync({
 memberId: currentMemberId,
 categoryId: cat.id,
 });
 toast.success("Catégorie archivée");
 refetch();
 } catch {
 toast.error("Erreur lors de l'archivage");
 }
 };

 const handleDelete = async (cat: GroupCategory) => {
 if (!window.confirm(`Supprimer définitivement "${cat.name}" ? Cette action est irréversible.`)) return;
 try {
 await deleteCategory.mutateAsync({
 memberId: currentMemberId,
 categoryId: cat.id,
 });
 toast.success("Catégorie supprimée");
 refetch();
 } catch {
 toast.error("Erreur lors de la suppression");
 }
 };

 const handleToggleSubActive = async (subId: string, active: boolean) => {
 try {
 await updateSubMut.mutateAsync({
 memberId: currentMemberId,
 subcategoryId: subId,
 isActive: active,
 });
 refetch();
 } catch {
 toast.error("Erreur");
 }
 };

 const openEdit = (cat: GroupCategory) => {
 setNewName(cat.name);
 setNewEmoji(cat.emoji);
 setNewColor(cat.color);
 setEditingCategory(cat);
 };

 const openAdd = () => {
 resetForm();
 setEditingCategory(null);
 setShowAddModal(true);
 };

 const renderFormModal = (isEdit: boolean) => (
 <div
 className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
 onClick={() => { isEdit ? setEditingCategory(null) : setShowAddModal(false); }}
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className="bg-background rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 space-y-5"
 >
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-bold">{isEdit ? "Modifier la catégorie" : "Nouvelle catégorie"}</h3>
 <button
 onClick={() => isEdit ? setEditingCategory(null) : setShowAddModal(false)}
 className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center"
 >
 <X size={16} />
 </button>
 </div>

 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <button
 onClick={() => setShowEmojiPicker(true)}
 className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center text-3xl shrink-0"
 >
 {newEmoji}
 </button>
 <input
 type="text"
 value={newName}
 onChange={(e) => setNewName(e.target.value)}
 placeholder="Nom de la catégorie"
 autoFocus
 className="flex-1 bg-card/50 border border-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
 />
 </div>

 <div>
 <p className="text-xs font-semibold text-muted-foreground mb-2">Couleur</p>
 <ColorPicker value={newColor} onSelect={(c) => setNewColor(c === newColor ? undefined : c)} />
 </div>
 </div>

 <button
 onClick={isEdit ? handleEdit : handleCreate}
 disabled={!newName.trim()}
 className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl disabled:opacity-50"
 >
 {isEdit ? "Enregistrer" : "Créer"}
 </button>
 </div>
 </div>
 );

 return (
 <div  className="max-w-md mx-auto px-5 pt-12 space-y-5">
 {/* Header */}
 <div className="flex items-center gap-3">
 <button
 onClick={onBack}
 className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center"
 >
 <ArrowLeft size={20} />
 </button>
 <h1 className="text-2xl font-bold tracking-tight flex-1">Gestion des catégories</h1>
 {activeCategories.length + inactiveCategories.length > 0 && (
 <span className="text-xs text-muted-foreground bg-card/50 px-2.5 py-1 rounded-full border border-border">
 {activeCategories.length + inactiveCategories.length}
 </span>
 )}
 </div>

 {/* Search */}
 <div className="relative">
 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Rechercher une catégorie..."
 className="w-full bg-card/50 border border-border rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
 />
 {search && (
 <button
 
 
 onClick={() => setSearch("")}
 className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary/50 flex items-center justify-center"
 >
 <X size={10} />
 </button>
 )}
 </div>

 {/* Add button */}
 <button
 onClick={openAdd}
 className="w-full py-3.5 rounded-2xl border-2 border-dashed border-primary/30 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
 >
 <Plus size={16} />
 Ajouter une catégorie
 </button>

 {/* Active Categories */}
 <div className="space-y-3">
 {activeCategories.length === 0 && !search && (
 <div className="text-center py-10">
 <Tag size={40} className="mx-auto text-muted-foreground/30 mb-3" />
 <p className="text-sm text-muted-foreground">Aucune catégorie</p>
 <p className="text-xs text-muted-foreground/60 mt-1">Commencez par en créer une</p>
 </div>
 )}
 {activeCategories.map((cat) => (
 <CategoryCard
 key={cat.id}
 category={cat}
 isExpanded={expandedId === cat.id}
 onToggleExpand={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
 onToggleActive={(active) => handleToggleActive(cat, active)}
 onEdit={() => openEdit(cat)}
 onArchive={() => handleArchive(cat)}
 onDelete={() => handleDelete(cat)}
 onAddSubcategory={() => {}}
 onEditSubcategory={() => {}}
 onDeleteSubcategory={() => {}}
 onToggleSubcategoryActive={handleToggleSubActive}
 isAdmin={true}
 />
 ))}
 </div>

 {/* Inactive Categories */}
 {inactiveCategories.length > 0 && (
 <div className="space-y-3">
 <div className="flex items-center gap-2 px-1">
 <Archive size={14} className="text-muted-foreground" />
 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Archivées</p>
 </div>
 {inactiveCategories.map((cat) => (
 <CategoryCard
 key={cat.id}
 category={cat}
 isExpanded={expandedId === cat.id}
 onToggleExpand={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
 onToggleActive={(active) => handleToggleActive(cat, active)}
 onEdit={() => openEdit(cat)}
 onArchive={() => handleArchive(cat)}
 onDelete={() => handleDelete(cat)}
 onAddSubcategory={() => {}}
 onEditSubcategory={() => {}}
 onDeleteSubcategory={() => {}}
 onToggleSubcategoryActive={handleToggleSubActive}
 isAdmin={true}
 />
 ))}
 </div>
 )}

 <div className="h-8" />

 {/* Modals */}
 
 {showAddModal && renderFormModal(false)}
 {editingCategory && renderFormModal(true)}
 {showEmojiPicker && (
 <EmojiPicker
 onSelect={(e) => setNewEmoji(e)}
 onClose={() => setShowEmojiPicker(false)}
 />
 )}
 
 </div>
 );
});
