'use client';

import { 
  Admin, 
  Resource, 
  List,
  Datagrid,
  TextField,
  DateField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  DateInput,
  SelectInput,
  useInput,
  InputProps,
  FileInput,
  FileField,
  ImageField,
  Layout,
  Menu,
  MenuItemLink,
} from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { fetchUtils } from 'react-admin';

const MarkdownEditor = dynamic(() => import('./MarkdownEditor'), {
  ssr: false,
  loading: () => <div>Loading editor...</div>,
});

const httpClient = (url: string, options: any = {}) => {
  options.credentials = 'include';
  return fetchUtils.fetchJson(url, options);
};

const baseDataProvider = simpleRestProvider('/api', httpClient);

const getUploadFile = (value: any): File | null => {
  const fileValue = Array.isArray(value) ? value[0] : value;

  if (!fileValue) {
    return null;
  }

  return fileValue.rawFile instanceof File ? fileValue.rawFile : null;
};

const getResponseError = async (response: Response): Promise<string> => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const errorBody = await response.json();
    return errorBody.error || 'Upload failed';
  }

  const errorText = await response.text();
  const trimmedText = errorText.replace(/\s+/g, ' ').trim();

  if (trimmedText.startsWith('<')) {
    return 'Upload failed because the server returned HTML instead of JSON. Check that your admin session is still valid and review the server logs for the underlying error.';
  }

  return trimmedText || 'Upload failed';
};

// Custom data provider to handle file uploads for media
const dataProvider = {
  ...baseDataProvider,
  create: (resource: string, params: any) => {
    if (resource === 'media' && params.data.file) {
      const uploadFile = getUploadFile(params.data.file);

      if (!uploadFile) {
        return Promise.reject(new Error('Select a file before uploading.'));
      }

      // Handle file upload
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (params.data.alt) {
        formData.append('alt', params.data.alt);
      }

      // Don't set Content-Type - let the browser set it with the boundary
      return fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
        // Important: Do NOT set Content-Type header for FormData
      })
        .then(async response => {
          if (!response.ok) {
            throw new Error(await getResponseError(response));
          }

          return response.json();
        })
        .then(data => ({ data }))
        .catch(error => {
          console.error('Upload error:', error);
          throw error;
        });
    }
    // Default behavior for other resources
    return baseDataProvider.create(resource, params);
  },
};

// Custom markdown input component
const MarkdownInput = (props: InputProps) => {
  const {
    field,
    fieldState: { isTouched, invalid, error },
  } = useInput(props);

  return (
    <div style={{ marginBottom: '1rem', width: '100%' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '0.5rem', 
        fontSize: '0.875rem', 
        fontWeight: 500,
        color: '#666' 
      }}>
        Content (Markdown) *
      </label>
      <MarkdownEditor
        value={field.value || ''}
        onChange={field.onChange}
      />
      {isTouched && invalid && (
        <div style={{ color: 'red', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          {error?.message}
        </div>
      )}
    </div>
  );
};

const PostList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="title" />
      <TextField source="slug" />
      <TextField source="status" />
      <DateField source="date" />
    </Datagrid>
  </List>
);

const PostEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" fullWidth />
      <TextInput source="slug" fullWidth />
      <TextInput source="excerpt" fullWidth multiline rows={3} />
      <MarkdownInput source="content" />
      <SelectInput source="status" choices={[
        { id: 'draft', name: 'Draft' },
        { id: 'published', name: 'Published' },
      ]} />
      <DateInput source="date" />
      <TextInput source="coverImage" fullWidth label="Cover Image URL" />
      <TextInput source="author.name" fullWidth label="Author Name" />
      <TextInput source="author.picture" fullWidth label="Author Picture URL" />
    </SimpleForm>
  </Edit>
);

const PostCreate = () => (
  <Create>
    <SimpleForm defaultValues={{
      status: 'draft',
      date: new Date().toISOString(),
      content: '# New Post\n\nStart writing your content here...',
      author: {
        name: 'Mike van der Sluis',
        picture: '/assets/blog/authors/mike2.jpg'
      }
    }}>
      <TextInput source="title" fullWidth required />
      <TextInput source="slug" fullWidth required helperText="URL-friendly version of title (e.g., my-post-title)" />
      <TextInput source="excerpt" fullWidth multiline rows={3} required />
      <MarkdownInput source="content" />
      <SelectInput source="status" choices={[
        { id: 'draft', name: 'Draft' },
        { id: 'published', name: 'Published' },
      ]} />
      <DateInput source="date" />
      <TextInput source="coverImage" fullWidth label="Cover Image URL" />
      <TextInput source="author.name" fullWidth label="Author Name" />
      <TextInput source="author.picture" fullWidth label="Author Picture URL" />
    </SimpleForm>
  </Create>
);

const UserList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <TextField source="email" />
      <DateField source="createdAt" />
    </Datagrid>
  </List>
);

const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" fullWidth />
      <TextInput source="email" fullWidth />
      <TextInput source="password" type="password" fullWidth helperText="Leave blank to keep current password" />
    </SimpleForm>
  </Edit>
);

const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" fullWidth required />
      <TextInput source="email" type="email" fullWidth required />
      <TextInput source="password" type="password" fullWidth required helperText="Password must be at least 8 characters" />
    </SimpleForm>
  </Create>
);

const MediaList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="filename" />
      <TextField source="url" />
      <TextField source="mimeType" />
      <DateField source="createdAt" />
    </Datagrid>
  </List>
);

const MediaCreate = () => (
  <Create>
    <SimpleForm>
      <FileInput 
        source="file" 
        label="File" 
        accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
        isRequired
      >
        <FileField source="src" title="title" />
      </FileInput>
      <TextInput source="alt" label="Alt Text" fullWidth helperText="Description for accessibility" />
    </SimpleForm>
  </Create>
);

// Custom menu with MFA link
const CustomMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <Menu.ResourceItem name="posts" />
    <Menu.ResourceItem name="users" />
    <Menu.ResourceItem name="media" />
    <MenuItemLink
      to="/admin/mfa"
      primaryText="MFA Settings"
      leftIcon={<span>🔐</span>}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        window.open('/admin/mfa', '_blank');
      }}
    />
  </Menu>
);

// Custom layout with our menu
const CustomLayout = (props: any) => <Layout {...props} menu={CustomMenu} />;

export default function AdminApp() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (!session) {
    return null;
  }

  return (
    <Admin dataProvider={dataProvider} layout={CustomLayout}>
      <Resource name="posts" list={PostList} edit={PostEdit} create={PostCreate} />
      <Resource name="users" list={UserList} edit={UserEdit} create={UserCreate} />
      <Resource name="media" list={MediaList} create={MediaCreate} />
    </Admin>
  );
}
