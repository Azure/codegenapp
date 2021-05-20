/****** Object:  Table [dbo].[AMEClientTools_Resource_Generate_Status]    Script Date: 4/26/2021 3:37:54 PM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AMEClientTools_Resource_Generate_Status]') AND type in (N'U'))
DROP TABLE [dbo].[AMEClientTools_Resource_Generate_Status]
GO

/****** Object:  Table [dbo].[AMEClientTools_Resource_Generate_Status]    Script Date: 4/26/2021 3:37:54 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[AMEClientTools_Resource_Generate_Status](
	[resourceProvider] [nvarchar](200) NOT NULL,
	[resourcesToGenerate] [nvarchar](500) NULL,
	[tag] [nvarchar](50) NULL,
	[swaggerPR] [nvarchar](500) NULL,
	[codePR] [nvarchar](500) NULL,
	[sdk] [nvarchar](50) NULL,
	[type] [nvarchar](50) NULL,
	[ignoreFailure] [nvarchar](500) NULL,
	[excludeStages] [nvarchar](200) NULL,
	[pipelineBuildID] [nvarchar](50) NULL,
	[status] [nvarchar](50) NULL
) ON [PRIMARY]
GO
